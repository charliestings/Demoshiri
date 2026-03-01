
-- 1. DATABASE: Fix 'profiles' table columns and policies
-- (Running this first ensures data can be saved even if storage setup issues persist)


-- Check/Create table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  email text
);

-- Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add potentially missing columns
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_income numeric;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_number text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_score numeric;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
END $$;

-- Fix Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING ( true );

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );



-- 2. STORAGE: Fix 'avatars' bucket and policies


-- Create the 'avatars' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- DROP existing policies manually to avoid conflicts
-- Note: 'storage.objects' policies might be named differently in your setup if created via UI.
-- attempting to drop common names.

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Delete" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u51k5_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u51k5_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u51k5_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1u51k5_3" ON storage.objects;

-- Re-create Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated Users Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Authenticated Users Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Authenticated Users Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
