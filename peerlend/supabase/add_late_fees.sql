-- Migration: Add Late Fee (Penalty) System
-- This adds the necessary columns to track due dates and calculate daily pro-rata fines.

-- 1. Update Loans Table Schema
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS late_fee_rate NUMERIC DEFAULT 5.0;

-- 2. Update process_loan_investment RPC to set Due Date
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
    calculated_due_date TIMESTAMPTZ;
BEGIN
    -- 1. Get Loan Details with Lock
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    
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
        -- Calculate Due Date based on duration
        calculated_due_date := NOW() + (loan_record.duration_months || ' months')::interval;

        -- DISBURSEMENT: Fully funded!
        UPDATE public.loans 
        SET funded_amount = new_funded_amount, 
            status = 'funded', 
            funded_at = NOW(),
            due_date = calculated_due_date,
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
        -- Update funded amount
        UPDATE public.loans 
        SET funded_amount = new_funded_amount, 
            status = 'approved',
            updated_at = NOW() 
        WHERE id = target_loan_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'is_fully_funded', new_funded_amount >= loan_record.amount,
        'due_date', calculated_due_date
    );
END;
$$;

-- 3. Update process_loan_repayment RPC to include Late Fees
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
    base_interest NUMERIC;
    base_repayment NUMERIC;
    days_late INTEGER;
    late_fee NUMERIC := 0;
    total_repayment NUMERIC;
    investor_record RECORD;
    investor_interest_share NUMERIC;
    investor_late_fee_share NUMERIC;
    investor_total_share NUMERIC;
    admin_id UUID;
    admin_fee NUMERIC := 0;
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

    -- 2. Calculate Base Repayment (Principal + Interest)
    base_interest := loan_record.amount * (loan_record.interest_rate / 100.0);
    base_repayment := loan_record.amount + base_interest;

    -- 3. Calculate Late Fee (Daily Pro-Rata based on Monthly Rate)
    IF NOW() > loan_record.due_date THEN
        -- Calculate days late
        days_late := EXTRACT(DAY FROM (NOW() - loan_record.due_date))::INTEGER;
        IF days_late > 0 THEN
            -- Monthly fine (e.g. 5%) / 30 * days_late
            late_fee := (base_repayment * (COALESCE(loan_record.late_fee_rate, 5.0) / 100.0) * (days_late / 30.0));
        END IF;
    END IF;

    total_repayment := base_repayment + late_fee;

    -- 4. Check & Deduct Borrower Balance
    SELECT balance INTO borrower_balance FROM public.wallets WHERE id = borrower_uid FOR UPDATE;
    IF borrower_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found for borrower');
    END IF;
    
    IF borrower_balance < total_repayment THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance. Need ' || ROUND(total_repayment, 2) || ' but have ' || borrower_balance);
    END IF;

    -- Update borrower balance
    UPDATE public.wallets 
    SET balance = balance - total_repayment, 
        updated_at = NOW() 
    WHERE id = borrower_uid;

    -- 5. Track Admin Fee (20% of late fee)
    admin_fee := late_fee * 0.20;
    SELECT id INTO admin_id FROM public.profiles WHERE is_admin = true LIMIT 1;
    
    IF admin_id IS NOT NULL AND admin_fee > 0 THEN
        UPDATE public.wallets 
        SET balance = balance + admin_fee,
            updated_at = NOW()
        WHERE id = admin_id;

        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (admin_id, admin_fee, 'earning', 'Penalty service fee collected from loan: ' || loan_record.purpose, target_loan_id);
    END IF;

    -- 6. DISTRIBUTE FUNDS TO INVESTORS (Interest + 80% of late fee)
    FOR investor_record IN SELECT * FROM public.investments WHERE loan_id = target_loan_id LOOP
        -- Principal share = investor_record.amount
        -- Interest share proportional to amount
        investor_interest_share := (investor_record.amount / loan_record.amount) * base_interest;
        
        -- Late fee share (80% distributed proportionally)
        investor_late_fee_share := (investor_record.amount / loan_record.amount) * (late_fee * 0.80);
        
        investor_total_share := investor_record.amount + investor_interest_share + investor_late_fee_share;

        -- Credit Investor Wallet
        UPDATE public.wallets 
        SET balance = balance + investor_total_share,
            updated_at = NOW()
        WHERE id = investor_record.investor_id;

        -- Log transaction for investor
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (
            investor_record.investor_id, 
            investor_total_share, 
            'earning', 
            'Repayment received for: ' || loan_record.purpose || 
            ' (Principal: ' || investor_record.amount || 
            ', Interest: ' || ROUND(investor_interest_share, 2) || 
            CASE WHEN investor_late_fee_share > 0 THEN ', Late Penalty Bonus: ' || ROUND(investor_late_fee_share, 2) ELSE '' END || ')', 
            target_loan_id
        );
    END LOOP;

    -- 7. Mark Loan as Repaid
    UPDATE public.loans 
    SET status = 'repaid', 
        updated_at = NOW() 
    WHERE id = target_loan_id;

    -- 8. Log Transaction for Borrower
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (
        borrower_uid, 
        -total_repayment, 
        'repayment', 
        'Repaid loan: ' || loan_record.purpose || 
        CASE WHEN late_fee > 0 THEN ' (including ₹' || ROUND(late_fee, 2) || ' late penalty)' ELSE '' END, 
        target_loan_id
    );

    RETURN jsonb_build_object(
        'success', true, 
        'repaid_amount', total_repayment, 
        'base_repayment', base_repayment,
        'late_fee', late_fee,
        'days_late', COALESCE(days_late, 0)
    );
END;
$$;
