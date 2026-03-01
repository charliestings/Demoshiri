-- check_debug.sql
-- Run this to see what columns and triggers exist

-- 1. Show Columns in 'profiles'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 2. Check explicitly if 'profile_image' exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'profile_image'
) as has_profile_image;

-- 3. Show Triggers on 'profiles'
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 4. Just try to update a test row (if you know your UUID, otherwise this is just syntax check)
-- UPDATE profiles SET profile_image = 'test' WHERE id = 'YOUR_UUID';

