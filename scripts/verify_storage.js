
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for debugging purposes
const supabaseUrl = 'https://xeaybhvngcorqefwnukw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlYXliaHZuZ2NvcnFlZndudWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDI3MDIsImV4cCI6MjA4NTg3ODcwMn0.zdzG5qf4KJoTKb9vOrnaFLo_wI50SKLuepjFi47mAAA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Supabase Storage and DB...');

    // 1. Check Storage Buckets
    console.log('\n--- Checking Storage Buckets ---');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
        console.error('Error listing buckets:', bucketsError.message);
    } else {
        const avatarsBucket = buckets.find(b => b.name === 'avatars');
        if (avatarsBucket) {
            console.log('✅ "avatars" bucket found.');
            console.log('   Public:', avatarsBucket.public);

            if (!avatarsBucket.public) {
                console.warn('⚠️ "avatars" bucket is NOT public. Images might not be visible.');
            }
        } else {
            console.error('❌ "avatars" bucket NOT found.');
        }
    }

    // 2. Check Profiles Table Schema
    console.log('\n--- Checking Profiles Table Schema ---');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, profile_image')
        .limit(1);

    if (profilesError) {
        console.error('❌ Error querying profiles:', profilesError.message);
    } else {
        console.log('✅ Query for "profile_image" succeeded.');
    }
}

verify();
