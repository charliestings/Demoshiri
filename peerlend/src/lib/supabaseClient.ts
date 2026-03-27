
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use a placeholder valid URL if the env var is missing or invalid (e.g. during build)
const validUrl = supabaseUrl && supabaseUrl.startsWith('http')
    ? supabaseUrl
    : 'https://placeholder.supabase.co'

const validKey = supabaseAnonKey || 'placeholder-key'

if (validUrl.includes('placeholder.supabase.co') && typeof window !== 'undefined') {
    console.warn("%c[PeerLend] CRITICAL: Using placeholder Supabase URL. Check your .env.local file!", "color: red; font-weight: bold; font-size: 14px;");
}

export const supabase = createClient(validUrl, validKey)

// Suppress known benign "Invalid Refresh Token" error caused by concurrent Next.js renders
if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
        const errorMsg = args[0] || '';
        if (typeof errorMsg === 'string' && errorMsg.includes('AuthApiError') && errorMsg.includes('Refresh Token Not Found')) {
            return; // Ignore this specific error
        }
        originalConsoleError(...args);
    };
}
