
-- FORCE ADMIN PERMISSION (Run in Supabase SQL Editor)
-- Run this if you see an "Unauthorized" or "Failed to update KYC" error


-- This will make EVERY account that has "admin" in its email address a real Admin in the database.
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  -- This finds users from Supabase Auth who have admin in their email
  SELECT id FROM auth.users WHERE email LIKE '%admin%'
);

-- After running this, try clicking "Approve Verification" again.
