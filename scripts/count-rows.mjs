import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count: loanCount } = await supabase.from('loans').select('*', { count: 'exact', head: true });
    const { count: invCount } = await supabase.from('investments').select('*', { count: 'exact', head: true });

    console.log(`📊 Current Loan Count: ${loanCount}`);
    console.log(`📊 Current Investment Count: ${invCount}`);
}

check();
