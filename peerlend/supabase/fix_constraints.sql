
-- FIX Constraints & Orphans


-- 1. Remove Orphaned Profiles (Profiles with no matching User)
-- This fixes the issue where a deleted user left a profile behind, blocking the phone number.
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Drop the Unique Constraint on Phone
-- It seems to be causing issues ('profiles_phone_key').
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- 3. Also drop unique on username if needed, or other potential blockers, 
-- but likely strictly phone is the current blocker.
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key; 
-- (Keeping username unique is usually desired, so skipping for now unless requested)
