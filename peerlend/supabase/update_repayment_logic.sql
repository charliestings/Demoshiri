-- Migration: Update Repayment Logic to distribute back to investors

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
    inv RECORD;
    investor_repayment NUMERIC;
BEGIN
    -- 1. Get Loan Details
    SELECT * INTO loan_record FROM public.loans WHERE id = target_loan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
    IF loan_record.status != 'funded' THEN RAISE EXCEPTION 'Only funded loans can be repaid'; END IF;
    IF loan_record.borrower_id != borrower_uid THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    -- 2. Calculate Total Repayment (Principal + Interest)
    total_repayment := loan_record.amount + (loan_record.amount * (loan_record.interest_rate / 100.0));

    -- 3. Check & Deduct Borrower Balance
    SELECT balance INTO borrower_balance FROM public.wallets WHERE id = borrower_uid FOR UPDATE;
    IF borrower_balance < total_repayment THEN RAISE EXCEPTION 'Insufficient balance to repay loan'; END IF;

    UPDATE public.wallets SET balance = balance - total_repayment, updated_at = NOW() WHERE id = borrower_uid;

    -- 4. Log Borrower Transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (borrower_uid, -total_repayment, 'repayment', 'Repayment for loan: ' || loan_record.purpose, target_loan_id);

    -- 5. Distribute Funds to Lenders (Investors)
    FOR inv IN SELECT * FROM public.investments WHERE loan_id = target_loan_id
    LOOP
        -- Calculate investor's share (Principal + Interest)
        investor_repayment := inv.amount + (inv.amount * (loan_record.interest_rate / 100.0));
        
        -- Credit investor's wallet
        UPDATE public.wallets 
        SET balance = balance + investor_repayment, updated_at = NOW() 
        WHERE id = inv.investor_id;

        -- Log investor transaction (Earning/Repayment Received)
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
        VALUES (inv.investor_id, investor_repayment, 'earning', 'Repayment received for: ' || loan_record.purpose, target_loan_id);
    END LOOP;

    -- 6. Mark Loan as Repaid
    UPDATE public.loans SET status = 'repaid', updated_at = NOW() WHERE id = target_loan_id;

    RETURN jsonb_build_object('success', true, 'repaid_amount', total_repayment);
END;
$$;
