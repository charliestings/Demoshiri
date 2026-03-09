-- Migration: Create Bank Accounts Table
-- This table stores linked bank accounts for user withdrawals

-- Drop the old table first since it was missing these new columns
DROP TABLE IF EXISTS public.bank_accounts CASCADE;

CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own bank accounts
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view their own bank accounts" 
    ON public.bank_accounts
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own bank accounts
DROP POLICY IF EXISTS "Users can insert their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can insert their own bank accounts" 
    ON public.bank_accounts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bank accounts
DROP POLICY IF EXISTS "Users can update their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can update their own bank accounts" 
    ON public.bank_accounts
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own bank accounts
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can delete their own bank accounts" 
    ON public.bank_accounts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create updated_at trigger (Drop first if exists to prevent errors on rerun)
DROP TRIGGER IF EXISTS handle_updated_at_bank_accounts ON public.bank_accounts;
CREATE TRIGGER handle_updated_at_bank_accounts
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
