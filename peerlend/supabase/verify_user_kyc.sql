
-- RENAMED RPC: Verify User KYC (JSONB Payload)
-- Renaming to force a schema cache refresh in Supabase


DROP FUNCTION IF EXISTS verify_user_kyc(jsonb);

CREATE OR REPLACE FUNCTION verify_user_kyc(payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner (Bypass RLS)
AS $$
DECLARE
  calling_user_is_admin boolean;
  target_uuid uuid;
  new_status text;
  rejection_reason text;
BEGIN
  -- 1. Extract values from JSONB payload
  target_uuid := (payload->>'target_user_id')::uuid;
  new_status := payload->>'new_status';
  rejection_reason := payload->>'rejection_reason';

  -- 2. Security Check: Check if the calling user (auth.uid()) is an admin
  SELECT is_admin INTO calling_user_is_admin 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- 3. Validate Permission
  IF calling_user_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can update KYC status';
  END IF;

  -- 4. Perform update
  UPDATE public.profiles
  SET 
    kyc_status = new_status,
    kyc_rejection_reason = rejection_reason,
    updated_at = NOW()
  WHERE id = target_uuid;

  RETURN true;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION verify_user_kyc TO authenticated;
