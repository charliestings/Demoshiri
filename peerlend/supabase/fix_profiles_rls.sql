
-- FORCE FIX PROFILES RLS
-- This script drops all known variations of policies and recreates them.


-- 1. Enable RLS (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential existing policies (covering various naming conventions)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.profiles;

DROP POLICY IF EXISTS "Public Profile Access" ON public.profiles;
DROP POLICY IF EXISTS "User Update Access" ON public.profiles;
DROP POLICY IF EXISTS "User Insert Access" ON public.profiles;

-- 3. Create Permissive Policies for Debugging/Fixing

-- READ: Everyone can read
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING ( true );

-- INSERT: Authenticated users can insert their own row
-- We add 'WITH CHECK' to ensure they only insert their own ID
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- UPDATE: Authenticated users can update their own row
-- This is critical. 'USING' determines which rows can be updated.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );
-- Note: If you don't provide WITH CHECK for update, it defaults to using the USING expression.

-- 4. Grant Permissions (in case role usage is weird)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO anon;

-- 5. (Optional) Force basic columns if they are drastically broken
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
