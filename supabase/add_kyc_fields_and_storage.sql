
-- 1. DATABASE: Update 'profiles' table with KYC fields


DO $$
BEGIN
    -- Add kyc_status column with default values
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_status text DEFAULT 'not_started';
        -- Set check constraint for valid statuses
        ALTER TABLE public.profiles ADD CONSTRAINT kyc_status_check CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected'));
    END IF;

    -- Add kyc_documents column (JSONB to store URLs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_documents') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_documents jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add kyc_rejection_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_rejection_reason') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_rejection_reason text;
    END IF;

    -- Add kyc_submitted_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_submitted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN kyc_submitted_at timestamptz;
    END IF;

    -- Add is_admin if it somehow doesn't exist (though it should based on dashboard/page.tsx)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
    END IF;
END $$;


-- 2. STORAGE: Create 'kyc-documents' bucket


INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false) -- Private bucket for security
ON CONFLICT (id) DO NOTHING;


-- 3. POLICIES: RLS for 'kyc-documents'


-- Clean up existing policies if any
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update KYC documents" ON storage.objects;

-- Policy 1: Users can upload their own documents (folder named after their UID)
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Admins can view all documents
-- We check if the user is an admin by querying the profiles table
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'kyc-documents' AND
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Policy 4: Admins can delete/update if needed (e.g. cleanup)
CREATE POLICY "Admins can manage all KYC documents"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'kyc-documents' AND
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
