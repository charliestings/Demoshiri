-- Migration: Add Transaction PIN Security
-- This adds a separate 6-digit PIN for financial transactions.

-- 1. Add columns to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'transaction_pin') THEN
        ALTER TABLE public.profiles ADD COLUMN transaction_pin TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'has_pin') THEN
        ALTER TABLE public.profiles ADD COLUMN has_pin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Ensure pgcrypto is enabled for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. RPC: Set/Update Transaction PIN
CREATE OR REPLACE FUNCTION public.set_transaction_pin(new_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate 6-digit numeric PIN
    IF new_pin !~ '^\d{6}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'PIN must be exactly 6 digits');
    END IF;

    -- Hash and store
    UPDATE public.profiles
    SET transaction_pin = crypt(new_pin, gen_salt('bf')),
        has_pin = true,
        updated_at = NOW()
    WHERE id = current_uid;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. RPC: Verify Transaction PIN
CREATE OR REPLACE FUNCTION public.verify_transaction_pin(input_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid UUID;
    stored_hash TEXT;
    is_valid BOOLEAN;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get stored hash
    SELECT transaction_pin INTO stored_hash
    FROM public.profiles
    WHERE id = current_uid;

    IF stored_hash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No PIN set for this account');
    END IF;

    -- Compare
    is_valid := (stored_hash = crypt(input_pin, stored_hash));

    RETURN jsonb_build_object('success', is_valid);
END;
$$;
