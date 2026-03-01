
-- IDENTITY PROTECTION MIGRATION
-- Prevents duplicate identities across accounts


DO $$ 
BEGIN
    -- 1. Add aadhar_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'aadhar_number') THEN
        ALTER TABLE public.profiles ADD COLUMN aadhar_number text;
    END IF;

    -- 2. Clean up existing data: Convert empty strings to NULL
    -- Unique constraints allow multiple NULLs, but only one empty string.
    UPDATE public.profiles SET pan_number = NULL WHERE pan_number = '';
    UPDATE public.profiles SET aadhar_number = NULL WHERE aadhar_number = '';

    -- 3. Add Unique Constraint for PAN Number
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pan_number_key;
    
    -- If there are STILL duplicates (two different real numbers that are the same), 
    -- this will fail and require manual cleanup.
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_pan_number_key UNIQUE (pan_number);

    -- 4. Add Unique Constraint for Aadhar Number
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_aadhar_number_key;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_aadhar_number_key UNIQUE (aadhar_number);

END $$;

-- 4. Create an index for faster lookups during validation
CREATE INDEX IF NOT EXISTS idx_profiles_pan_identity ON public.profiles (pan_number) WHERE pan_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_aadhar_identity ON public.profiles (aadhar_number) WHERE aadhar_number IS NOT NULL;

-- 5. Helper function to check for identity existence (Optional but useful for RPC)
CREATE OR REPLACE FUNCTION check_identity_exists(input_pan text, input_aadhar text, current_user_id uuid)
RETURNS TABLE(pan_exists boolean, aadhar_exists boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.profiles WHERE pan_number = input_pan AND id != current_user_id) as pan_exists,
        EXISTS(SELECT 1 FROM public.profiles WHERE aadhar_number = input_aadhar AND id != current_user_id) as aadhar_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
