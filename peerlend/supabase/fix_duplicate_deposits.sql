-- Migration: Fix Duplicate Deposits (Idempotency)

-- 1. Change reference_id from UUID to TEXT to support Cashfree order IDs
ALTER TABLE public.wallet_transactions 
ALTER COLUMN reference_id TYPE TEXT;

-- 2. Update deposit_funds to be idempotent
CREATE OR REPLACE FUNCTION public.deposit_funds(amount_to_add NUMERIC, p_order_id TEXT DEFAULT NULL)
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

    -- Idempotency check: If order_id is provided, check if it was already processed
    IF p_order_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.wallet_transactions 
            WHERE wallet_id = current_uid 
            AND reference_id = p_order_id 
            AND type = 'deposit'
        ) THEN
            -- Already processed, return current balance
            SELECT balance INTO new_balance FROM public.wallets WHERE id = current_uid;
            RETURN jsonb_build_object('success', true, 'new_balance', new_balance, 'already_processed', true);
        END IF;
    END IF;

    -- Update wallet
    UPDATE public.wallets
    SET balance = balance + amount_to_add,
        updated_at = NOW()
    WHERE id = current_uid
    RETURNING balance INTO new_balance;

    -- Log transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (current_uid, amount_to_add, 'deposit', 'Funds added to wallet', p_order_id);

    RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;
