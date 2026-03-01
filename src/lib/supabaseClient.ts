
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use a placeholder valid URL if the env var is missing or invalid (e.g. during build)
const validUrl = supabaseUrl && supabaseUrl.startsWith('http')
    ? supabaseUrl
    : 'https://placeholder.supabase.co'

const validKey = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(validUrl, validKey)
