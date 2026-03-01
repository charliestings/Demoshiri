-- DOCUMENT FINGERPRINTING MIGRATION
-- Detects identical file uploads across accounts

DO $$ 
BEGIN
    -- Add document_hashes column if it doesn't exist
    -- Stores { id_front: 'hash...', id_back: 'hash...', pan_card: 'hash...', selfie: 'hash...' }
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_hashes') THEN
        ALTER TABLE public.profiles ADD COLUMN document_hashes jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Index for scanning JSONB keys if needed (though with few users, serial check is fine)
CREATE INDEX IF NOT EXISTS idx_profiles_doc_hashes ON public.profiles USING gin (document_hashes);
