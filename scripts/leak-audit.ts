import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually for script context
const envPath = path.join(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
        env[parts[0].trim()] = parts[1].trim();
    }
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Profile {
    id: string;
    full_name: string;
    email?: string;
    is_admin: boolean;
}

interface Investment {
    id: string;
    // ... other fields
}

interface Loan {
    id: string;
    status: string;
}

async function leakAudit() {
    console.log('--- DATA LEAKAGE AUDIT (strictly typed) ---');

    console.log('\n[Checking Profiles]');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.log('Error:', pError.message);
    } else if (profiles) {
        const typedProfiles = profiles as Profile[];
        typedProfiles.forEach(p => {
            console.log(`- Profile Found: ID: ${p.id}, Name: ${p.full_name}, Email: ${p.email || 'HIDDEN'}, Admin: ${p.is_admin}`);
        });
        if (typedProfiles.length > 0) {
            console.log('---');
            console.log('ANALYSIS: If you see admin values for other users here, RLS on profiles is too broad.');
        }
    }

    console.log('\n[Checking Investments]');
    const { data: investments, error: iError } = await supabase.from('investments').select('*');
    if (iError) {
        console.log('Error:', iError.message);
    } else if (investments) {
        console.log(`Total investments visible to public: ${investments.length}`);
        if (investments.length > 0) {
            console.log('CRITICAL: All investment details should not be public.');
        }
    }

    console.log('\n[Checking Loans]');
    const { data: loans, error: lError } = await supabase.from('loans').select('*');
    if (lError) {
        console.error('Error:', lError.message);
    } else if (loans) {
        const typedLoans = loans as Loan[];
        const statuses = [...new Set(typedLoans.map(l => l.status))];
        console.log(`Loan statuses visible: ${statuses.join(', ')}`);
        const pendingCount = typedLoans.filter(l => l.status === 'pending').length;
        if (pendingCount > 0) {
            console.log(`WARNING: ${pendingCount} pending loans are visible to public. Only approved/funded should be public.`);
        }
    }
}

leakAudit();
