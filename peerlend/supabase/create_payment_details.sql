-- Migration: Create Payment Details Table for Cashfree Metadata (Clean Start)

-- Drop if exists to avoid schema conflicts with manually created tables
DROP TABLE IF EXISTS public.payment_details CASCADE;

CREATE TABLE public.payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    cf_order_id TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL,
    payment_method TEXT,
    cf_payment_id TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;

-- 1. Users can see their own payment details
DROP POLICY IF EXISTS "Users can view own payment details" ON public.payment_details;
CREATE POLICY "Users can view own payment details" ON public.payment_details
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can insert their own payment details
DROP POLICY IF EXISTS "Users can insert own payment details" ON public.payment_details;
CREATE POLICY "Users can insert own payment details" ON public.payment_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own payment details
DROP POLICY IF EXISTS "Users can update own payment details" ON public.payment_details;
CREATE POLICY "Users can update own payment details" ON public.payment_details
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.payment_details;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.payment_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Force internal access for the service role or authenticated users through RPC/api
-- (Using the authenticated user's context in the Next.js API route)
