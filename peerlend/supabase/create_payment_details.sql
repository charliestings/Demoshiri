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

-- Policy: Users can see their own payment details
DROP POLICY IF EXISTS "Users can view own payment details" ON public.payment_details;
CREATE POLICY "Users can view own payment details" ON public.payment_details
    FOR SELECT USING (auth.uid() = user_id);

-- Force internal access for the service role or authenticated users through RPC/API
-- (Assuming standard authenticated access is sufficient for the Next.js API route)
