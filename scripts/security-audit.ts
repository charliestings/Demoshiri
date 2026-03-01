import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function runSecurityAudit() {
    console.log('--- PEERLEND SECURITY AUDIT (strictly typed) ---');

    const tables = ['profiles', 'loans', 'investments'];

    for (const table of tables) {
        console.log(`\nChecking table: ${table}`);

        // 1. Check if RLS is enabled
        const { data, error } = await supabase.from(table).select('*').limit(5);

        if (error) {
            console.log(`[-] SELECT denied (Good/RLS active): ${error.message}`);
        } else if (data) {
            console.log(`[!] SELECT allowed (Warning: if this shows other users' data, RLS is weak/off)`);
            console.log(`    Total rows visible: ${data.length}`);
        }

        // 2. Try an unauthenticated insert (should fail)
        const { error: insertError } = await supabase.from(table).insert({ id: '00000000-0000-0000-0000-000000000000' } as any);
        if (insertError) {
            console.log(`[-] Unauth INSERT denied (Good): ${insertError.message}`);
        } else {
            console.log(`[!] Unauth INSERT allowed (CRITICAL VULNERABILITY)`);
        }
    }

    console.log('\n--- SENSITIVE KEY SCAN ---');
    // Note: readdirSync Recursive is only supported in Node 18.17+ or 20+
    const files = fs.readdirSync(process.cwd(), { recursive: true } as any) as string[];
    let foundSecrets = false;
    for (const file of files) {
        if (file.includes('node_modules') || file.includes('.next') || file.includes('.git')) continue;
        const filePath = path.join(process.cwd(), file);
        if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('service_role') || content.includes('postgres_password')) {
                console.log(`[!] Found potential secret in: ${file}`);
                foundSecrets = true;
            }
        }
    }
    if (!foundSecrets) console.log('[+] No hardcoded high-privilege secrets found in local source.');
}

runSecurityAudit();
