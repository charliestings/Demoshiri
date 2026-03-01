-- Update deposit_funds to require KYC

CREATE OR REPLACE FUNCTION public.deposit_funds(amount_to_add NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
    new_balance NUMERIC;
    user_kyc_status TEXT;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check KYC Status
    SELECT kyc_status INTO user_kyc_status FROM public.profiles WHERE id = current_uid;
    IF user_kyc_status != 'approved' THEN
        RAISE EXCEPTION 'KYC verification approved status is required to add funds';
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
