-- Add AI match results and liveness status to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS kyc_match_score NUMERIC,
ADD COLUMN IF NOT EXISTS kyc_liveness_verified BOOLEAN DEFAULT FALSE;

-- Ensure public access to match results for admins
COMMENT ON COLUMN profiles.kyc_match_score IS 'AI generated similarity score between ID and Selfie';
COMMENT ON COLUMN profiles.kyc_liveness_verified IS 'Whether the user passed the liveness check (blink/smile)';
