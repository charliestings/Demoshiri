
-- Migration: Create Wallet System (FINAL FIX)


-- 0. Ensure extensions are available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Cleanup existing tables if they are in a broken state
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- 2. Create Wallet Table
-- We reference auth.users(id) directly as it is guaranteed to exist
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Wallet Transactions Table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'loan_disbursement', 'repayment', 'earning')),
    reference_id UUID, 
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = wallet_id);

-- 6. Trigger for New User Wallets
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map to the profiles table trigger
DROP TRIGGER IF EXISTS on_profile_created_wallet ON public.profiles;
CREATE TRIGGER on_profile_created_wallet
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 7. Initialize Wallets for Existing Users
INSERT INTO public.wallets (id)
SELECT id FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 8. RPC: Deposit Funds
CREATE OR REPLACE FUNCTION public.deposit_funds(amount_to_add NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
    new_balance NUMERIC;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF amount_to_add <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Update wallet
    UPDATE public.wallets
    SET balance = balance + amount_to_add,
        updated_at = NOW()
    WHERE id = current_uid
    RETURNING balance INTO new_balance;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    VALUES (current_uid, amount_to_add, 'deposit', 'Funds added to wallet');

    RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;

-- 9. RPC: Withdraw/Spend Funds
CREATE OR REPLACE FUNCTION public.process_wallet_transaction(
    target_uid UUID,
    transaction_amount NUMERIC,
    transaction_type TEXT,
    transaction_desc TEXT,
    ref_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
BEGIN
    -- Only allows authenticated users to spend their own money, or admins
    IF auth.uid() != target_uid AND NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get current balance
    SELECT balance INTO current_balance FROM public.wallets WHERE id = target_uid;
    
    IF current_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found for user';
    END IF;

    IF current_balance < transaction_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Update balance
    UPDATE public.wallets
    SET balance = balance - transaction_amount,
        updated_at = NOW()
    WHERE id = target_uid
    RETURNING balance INTO new_balance;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (target_uid, -transaction_amount, transaction_type, transaction_desc, ref_id);

    RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;

-- 10. RPC: Process Loan Investment (Atomic)
CREATE OR REPLACE FUNCTION public.process_loan_investment(
    investor_uid UUID,
    target_loan_id UUID,
    invest_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loan_record RECORD;
    new_funded_amount NUMERIC;
    investor_balance NUMERIC;
BEGIN
    -- 1. Get Loan Details
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    IF loan_record.status NOT IN ('approved', 'funding') THEN RAISE EXCEPTION 'Loan is not open for investment'; END IF;
    
    -- 2. Validate Amount
    IF invest_amount > (loan_record.amount - loan_record.funded_amount) THEN
        RAISE EXCEPTION 'Amount exceeds remaining fund needed';
    END IF;

    -- 3. Check & Deduct Investor Balance
    SELECT balance INTO investor_balance FROM public.wallets WHERE id = investor_uid FOR UPDATE;
    IF investor_balance < invest_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

    UPDATE public.wallets SET balance = balance - invest_amount, updated_at = NOW() WHERE id = investor_uid;
    
    -- Log investor transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (investor_uid, -invest_amount, 'investment', 'Investment in loan: ' || loan_record.purpose, target_loan_id);

    -- 4. Create/Update Investment Record
    INSERT INTO public.investments (investor_id, loan_id, amount)
    VALUES (investor_uid, target_loan_id, invest_amount)
    ON CONFLICT (investor_id, loan_id) 
    DO UPDATE SET amount = public.investments.amount + EXCLUDED.amount;

    -- 5. Update Loan Funded Amount
    new_funded_amount := loan_record.funded_amount + invest_amount;
    
    IF new_funded_amount >= loan_record.amount THEN
        -- DISBURSEMENT: Fully funded!
        UPDATE public.loans 
        SET funded_amount = new_funded_amount, status = 'funded', updated_at = NOW()
        WHERE id = target_loan_id;

        -- Credit Borrower's Wallet
        UPDATE public.wallets 
        SET balance = balance + loan_record.amount, updated_at = NOW()
        WHERE id = loan_record.borrower_id;

        -- Log borrower's transaction (Disbursement)
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (loan_record.borrower_id, loan_record.amount, 'loan_disbursement', 'Loan funded and disbursed: ' || loan_record.purpose, target_loan_id);
    ELSE
        UPDATE public.loans SET funded_amount = new_funded_amount, status = 'approved', updated_at = NOW() WHERE id = target_loan_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'is_fully_funded', new_funded_amount >= loan_record.amount);
END;
$$;

-- 11. RPC: Process Loan Repayment
CREATE OR REPLACE FUNCTION public.process_loan_repayment(
    borrower_uid UUID,
    target_loan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    loan_record RECORD;
    borrower_balance NUMERIC;
    total_repayment NUMERIC;
BEGIN
    -- 1. Get Loan Details
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    IF loan_record.status != 'funded' THEN RAISE EXCEPTION 'Only funded loans can be repaid'; END IF;
    IF loan_record.borrower_id != borrower_uid THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    -- 2. Calculate Repayment (Principal + Interest)
    -- Simple interest for MVP: Principal + (Principal * Rate / 100)
    total_repayment := loan_record.amount + (loan_record.amount * (loan_record.interest_rate / 100.0));

    -- 3. Check & Deduct Borrower Balance
    SELECT balance INTO borrower_balance FROM public.wallets WHERE id = borrower_uid FOR UPDATE;
    IF borrower_balance < total_repayment THEN RAISE EXCEPTION 'Insufficient balance to repay loan'; END IF;

    UPDATE public.wallets SET balance = balance - total_repayment, updated_at = NOW() WHERE id = borrower_uid;

    -- 4. Mark Loan as Repaid
    UPDATE public.loans SET status = 'repaid', updated_at = NOW() WHERE id = target_loan_id;

    -- 5. Log Transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (borrower_uid, -total_repayment, 'repayment', 'Repayment for loan: ' || loan_record.purpose, target_loan_id);

    RETURN jsonb_build_object('success', true, 'repaid_amount', total_repayment);
END;
$$;
