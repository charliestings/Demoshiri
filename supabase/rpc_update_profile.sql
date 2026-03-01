
-- RPC: Update Profile Data (Bypass RLS)


-- Drop existing function if any
DROP FUNCTION IF EXISTS update_profile_data;

-- create or replace function
CREATE OR REPLACE FUNCTION update_profile_data(
  full_name text DEFAULT NULL,
  username text DEFAULT NULL,
  bio text DEFAULT NULL,
  gender text DEFAULT NULL,
  date_of_birth date DEFAULT NULL,
  profile_image text DEFAULT NULL,
  phone text DEFAULT NULL,
  address text DEFAULT NULL,
  city text DEFAULT NULL,
  state text DEFAULT NULL,
  pincode text DEFAULT NULL,
  occupation text DEFAULT NULL,
  monthly_income numeric DEFAULT NULL,
  pan_number text DEFAULT NULL,
  email_notifications boolean DEFAULT TRUE
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner (Bypass RLS)
AS $$
DECLARE
  current_user_id uuid;
  result json;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update or Insert (Upsert) the profile
  INSERT INTO public.profiles (
    id, 
    full_name, username, bio, gender, date_of_birth, profile_image,
    phone, address, city, state, pincode,
    occupation, monthly_income, pan_number, 
    email_notifications,
    updated_at
  )
  VALUES (
    current_user_id,
    full_name, username, bio, gender, date_of_birth, profile_image,
    phone, address, city, state, pincode,
    occupation, monthly_income, pan_number,
    email_notifications,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    bio = EXCLUDED.bio,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth,
    profile_image = COALESCE(EXCLUDED.profile_image, profiles.profile_image), -- Don't overwrite image if null
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    pincode = EXCLUDED.pincode,
    occupation = EXCLUDED.occupation,
    monthly_income = EXCLUDED.monthly_income,
    pan_number = EXCLUDED.pan_number,
    email_notifications = EXCLUDED.email_notifications,
    updated_at = NOW();

  -- Return the updated row as JSON
  SELECT row_to_json(p) INTO result FROM public.profiles p WHERE id = current_user_id;
  RETURN result;
END;
$$;
