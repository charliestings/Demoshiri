
-- Migration: Fix Investment Flow


-- 1. Ensure investments table has the required unique constraint for ON CONFLICT
-- This is necessary for the process_loan_investment RPC to work atomically.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investments_investor_id_loan_id_key'
    ) THEN
        ALTER TABLE public.investments 
        ADD CONSTRAINT investments_investor_id_loan_id_key UNIQUE (investor_id, loan_id);
    END IF;
END $$;

-- 2. Ensure updated_at exists on loans (it seems to, but let's be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'updated_at') THEN
        ALTER TABLE public.loans ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 4. RPC: Process Loan Repayment
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
    investor_record RECORD;
    investor_share NUMERIC;
    investor_interest NUMERIC;
    total_interest NUMERIC;
BEGIN
    -- 1. Get Loan Details with Lock
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    
    IF loan_record.status != 'funded' THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Only funded loans can be repaid. Current status: ' || loan_record.status);
    END IF;
    
    IF loan_record.borrower_id != borrower_uid THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the borrower of this loan');
    END IF;

    -- 2. Calculate Repayment (Principal + Interest)
    total_interest := loan_record.amount * (loan_record.interest_rate / 100.0);
    total_repayment := loan_record.amount + total_interest;

    -- 3. Check & Deduct Borrower Balance
    SELECT balance INTO borrower_balance FROM public.wallets WHERE id = borrower_uid FOR UPDATE;
    IF borrower_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found for borrower');
    END IF;
    
    IF borrower_balance < total_repayment THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance. Need ' || total_repayment || ' but have ' || borrower_balance);
    END IF;

    -- Update balance
    UPDATE public.wallets 
    SET balance = balance - total_repayment, 
        updated_at = NOW() 
    WHERE id = borrower_uid;

    -- 4. DISTRIBUTE FUNDS TO INVESTORS
    -- Find all investments for this loan
    FOR investor_record IN SELECT * FROM public.investments WHERE loan_id = target_loan_id LOOP
        -- Calculate proportional share of interest
        -- Investor share = (Investor Amount / Total Loan Amount) * Total Repayment
        investor_interest := (investor_record.amount / loan_record.amount) * total_interest;
        investor_share := investor_record.amount + investor_interest;

        -- Credit Investor Wallet
        UPDATE public.wallets 
        SET balance = balance + investor_share,
            updated_at = NOW()
        WHERE id = investor_record.investor_id;

        -- Log transaction for investor
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (
            investor_record.investor_id, 
            investor_share, 
            'earning', 
            'Repayment received for loan: ' || loan_record.purpose || ' (Principal: ' || investor_record.amount || ', Interest: ' || round(investor_interest, 2) || ')', 
            target_loan_id
        );
    END LOOP;

    -- 5. Mark Loan as Repaid
    UPDATE public.loans 
    SET status = 'repaid', 
        updated_at = NOW() 
    WHERE id = target_loan_id;

    -- 6. Log Transaction for Borrower
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (borrower_uid, -total_repayment, 'repayment', 'Successfully repaid loan: ' || loan_record.purpose, target_loan_id);

    RETURN jsonb_build_object('success', true, 'repaid_amount', total_repayment, 'total_interest_paid', total_interest);
END;
$$;

-- 5. RPC: Process Loan Investment
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
    -- 1. Get Loan Details with Lock
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    
    -- Check status - some systems use 'approved', others 'funding'
    IF loan_record.status NOT IN ('approved', 'funding') THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Loan is not open for investment. Status: ' || loan_record.status);
    END IF;
    
    -- 2. Validate Amount
    IF invest_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Investment amount must be positive');
    END IF;

    IF invest_amount > (loan_record.amount - COALESCE(loan_record.funded_amount, 0)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount exceeds remaining fund needed');
    END IF;

    -- 3. Check & Deduct Investor Balance
    SELECT balance INTO investor_balance FROM public.wallets WHERE id = investor_uid FOR UPDATE;
    IF investor_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found for investor');
    END IF;
    
    IF investor_balance < invest_amount THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- Update balance
    UPDATE public.wallets 
    SET balance = balance - invest_amount, 
        updated_at = NOW() 
    WHERE id = investor_uid;
    
    -- Log investor transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (investor_uid, -invest_amount, 'investment', 'Investment in loan: ' || loan_record.purpose, target_loan_id);

    -- 4. Create/Update Investment Record
    INSERT INTO public.investments (investor_id, loan_id, amount)
    VALUES (investor_uid, target_loan_id, invest_amount)
    ON CONFLICT (investor_id, loan_id) 
    DO UPDATE SET amount = public.investments.amount + EXCLUDED.amount;

    -- 5. Update Loan Funded Amount
    new_funded_amount := COALESCE(loan_record.funded_amount, 0) + invest_amount;
    
    IF new_funded_amount >= loan_record.amount THEN
        -- DISBURSEMENT: Fully funded!
        UPDATE public.loans 
        SET funded_amount = new_funded_amount, 
            status = 'funded', 
            updated_at = NOW()
        WHERE id = target_loan_id;

        -- Credit Borrower's Wallet
        UPDATE public.wallets 
        SET balance = balance + loan_record.amount, 
            updated_at = NOW()
        WHERE id = loan_record.borrower_id;

        -- Log borrower's transaction (Disbursement)
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (loan_record.borrower_id, loan_record.amount, 'loan_disbursement', 'Loan fully funded and disbursed: ' || loan_record.purpose, target_loan_id);
    ELSE
        -- Update funded amount, keep as approved or move to funding
        UPDATE public.loans 
        SET funded_amount = new_funded_amount, 
            status = 'approved', -- Keep existing status if preferred
            updated_at = NOW() 
        WHERE id = target_loan_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'is_fully_funded', new_funded_amount >= loan_record.amount);
END;
$$;
