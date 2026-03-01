
-- SECURITY HARDENING: Restricted Profiles RLS


-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 3. Create Fine-Grained Policies

-- Policy A: Users can see ALL of their own data
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- Policy B: Admins can see ALL data for verification
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true );

-- Policy C: Public can only see NON-SENSITIVE fields of others
-- In Supabase, standard RLS doesn't easily support column-level SELECT filtering within a single policy.
-- A common workaround is to use a View for public data or use a permissive policy that is careful not to leak data if the app is coded correctly.
-- However, for true security at the DB level, we use a more restrictive approach.

-- We'll allow public the ability to see names/images, but the app must be responsible for selecting only those.
-- To be even safer, we can use a policy that excludes sensitive rows if we have a way to identify them.
-- For now, let's keep the SELECT policy restricted to OWN and ADMIN, and we will create a PUBLIC profile view for other social features.

CREATE OR REPLACE VIEW public_profiles AS
SELECT id, full_name, username, profile_image, bio, kyc_status, created_at
FROM profiles;

GRANT SELECT ON public_profiles TO authenticated, anon;

-- Policy C: Allow everyone to see BASIC INFO of everyone else
-- This avoids breaking joins in loan lists while still protecting PII
CREATE POLICY "Public basic info access"
ON public.profiles FOR SELECT
TO authenticated
USING ( true );

-- WARNING: The above policy allows SELECT * for all rows. 
-- In a production app, we would ideally REVOKE SELECT on sensitive columns.
-- However, for this implementation, we will rely on the app to only select needed fields 
-- and the VIEW for social features. 

-- To be TRULY secure, we'll keep SELECT restricted to OWNER/ADMIN 
-- and I'll update the frontend query to use the view where it breaks.
DROP POLICY IF EXISTS "Public basic info access" ON public.profiles;

-- Policy D: Update/Insert remain restricted to owner or admin
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true );

-- Commenting on sensitive columns to document protection
COMMENT ON COLUMN profiles.pan_number IS 'Sensitive PII: Protected by RLS';
COMMENT ON COLUMN profiles.kyc_documents IS 'Sensitive PII: Storage paths only, Protected by RLS';
COMMENT ON COLUMN profiles.phone IS 'Sensitive PII: Protected by RLS';
COMMENT ON COLUMN profiles.address IS 'Sensitive PII: Protected by RLS';
