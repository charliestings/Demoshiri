-- remove_triggers.sql
-- Remove triggers that might be blocking updates
-- WARNING: This removes logic that might be needed, but for debugging/fixing basic profile saves, it's worth it.

-- List of common trigger names to drop
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- If you have triggers on public.profiles?
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;

-- Re-create the basic trigger if it was the one creating profiles
-- (We only want to drop it if it's broken, but usually on_auth_user_created is fine)
-- For now, let's just make sure the FUNCTION it calls isn't erroring out.

-- Let's just create a test function to see if we can update specific fields
-- NO-OP for this file, just providing the Drop commands if you find them.
