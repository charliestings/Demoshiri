
-- DISABLE RLS & TRIGGERS (DEBUGGING ONLY)
-- This script effectively turns off security to see if policies are the problem.


-- 1. Disable Row Level Security on Profiles
-- If this fixes the issue, we know 100% that our Policies ("Users can update own...") were wrong.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop Triggers that might be messing up data
-- Triggers can sometimes intercept an INSERT/UPDATE and change values or fail silently.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;

-- 3. Grant Permissions explicit (just in case)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 4. Verify the change by selecting triggers (Empty result is good for debugging here)
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
