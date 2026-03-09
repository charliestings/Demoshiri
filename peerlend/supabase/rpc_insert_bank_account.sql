-- Run this script in the Supabase SQL Editor to bypass schema cache issues

CREATE OR REPLACE FUNCTION public.insert_bank_account(
    p_user_id UUID,
    p_account_holder_name TEXT,
    p_account_number TEXT,
    p_ifsc_code TEXT,
    p_bank_name TEXT,
    p_is_primary BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_account RECORD;
BEGIN
    INSERT INTO public.bank_accounts (
        user_id,
        account_holder_name,
        account_number,
        ifsc_code,
        bank_name,
        is_primary
    ) VALUES (
        p_user_id,
        p_account_holder_name,
        p_account_number,
        p_ifsc_code,
        p_bank_name,
        p_is_primary
    ) RETURNING * INTO new_account;

    RETURN row_to_json(new_account)::jsonb;
END;
$$;
