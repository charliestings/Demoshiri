import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually since we don't have dotenv
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing Supabase environment variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log("🚀 Starting database cleanup...");

    try {
        // 1. Delete all investments
        console.log("🗑️ Deleting all investments...");
        const { error: invErr } = await supabase
            .from('investments')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (invErr) {
            console.error("❌ Error deleting investments:", invErr.message);
        } else {
            console.log("✅ Investments cleared.");
        }

        // 2. Delete all loans
        console.log("🗑️ Deleting all loans...");
        const { error: loanErr } = await supabase
            .from('loans')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (loanErr) {
            console.error("❌ Error deleting loans:", loanErr.message);
        } else {
            console.log("✅ Loans cleared.");
        }

        if (!invErr && !loanErr) {
            console.log("✨ Cleanup successful! All tables are empty.");
        } else {
            console.log("⚠️ Cleanup finished with errors. Note: RLS policies might prevent deletion if you don't have owner/admin rights.");
        }

    } catch (err) {
        console.error("💥 Unexpected error:", err);
    }
}

cleanup();
