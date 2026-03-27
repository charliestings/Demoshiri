"use server";

import { createClient } from '@supabase/supabase-js';

export async function notifyAdminsOfMessage(name: string, subject: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase env keys for Server Action");
        return { success: false, error: "Missing keys" };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Fetch all profiles using service_role key to bypass RLS
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, is_admin');

        if (profileError) throw profileError;

        // Filter valid admins
        const admins = profiles?.filter((p: any) => p.is_admin || p.email?.includes('admin')) || [];

        if (admins.length > 0) {
            const notificationsToInsert = admins.map((admin: any) => ({
                user_id: admin.id,
                title: "New Support Message",
                message: `You have a new unread contact form message from ${name} (${subject}).`,
                type: "support",
                link: "/dashboard/admin"
            }));

            // Insert notifications overriding RLS
            const { error: notifError } = await supabaseAdmin
                .from('notifications')
                .insert(notificationsToInsert);

            if (notifError) throw notifError;
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Error in notifyAdminsOfMessage:", error);
        return { success: false, error: error.message };
    }
}
