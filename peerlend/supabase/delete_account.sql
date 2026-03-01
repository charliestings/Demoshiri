-- Secure Account Deletion RPC
-- This script must be run in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_wallet_balance decimal;
    v_active_loans_count integer;
    v_active_investments_count integer;
BEGIN
    -- Get the UID of the user calling the function
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Check Wallet Balance
    SELECT balance INTO v_wallet_balance FROM wallets WHERE id = v_user_id;
    IF v_wallet_balance > 0 THEN
        RAISE EXCEPTION 'Cannot delete account with a positive wallet balance. Please withdraw your funds (₹%) first.', v_wallet_balance;
    END IF;

    -- 2. Check Active Borrowed Loans (status: pending, approved, funded)
    SELECT COUNT(*) INTO v_active_loans_count 
    FROM loans 
    WHERE borrower_id = v_user_id 
    AND status IN ('pending', 'approved', 'funded');

    IF v_active_loans_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete account while you have % active loan(s). You must repay them before deleting your account.', v_active_loans_count;
    END IF;

    -- 3. Check Active Investments (status: active)
    SELECT COUNT(*) INTO v_active_investments_count 
    FROM investments 
    WHERE investor_id = v_user_id 
    AND status = 'active';

    IF v_active_investments_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete account while you have % active investment(s) in other loans. You must wait for them to be repaid.', v_active_investments_count;
    END IF;

    -- If all checks pass, delete the user from auth.users.
    -- Because auth.users.id is the primary key and we presumably have ON DELETE CASCADE
    -- on our foreign keys (profiles, wallets, etc), this will completely wipe them.
    -- If ON DELETE CASCADE is missing on certain tables, the deletion might fail or leave orphans.
    
    DELETE FROM auth.users WHERE id = v_user_id;

END;
$$;
