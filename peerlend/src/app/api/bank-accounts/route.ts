import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, account_holder_name, account_number, ifsc_code, bank_name, is_primary } = body;

        if (!user_id || !account_holder_name || !account_number || !ifsc_code || !bank_name) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Bypassing client-side and PostgREST schema cache using an RPC function
        const { data, error } = await supabaseAdmin.rpc('insert_bank_account', {
            p_user_id: user_id,
            p_account_holder_name: account_holder_name,
            p_account_number: account_number,
            p_ifsc_code: ifsc_code,
            p_bank_name: bank_name,
            p_is_primary: is_primary
        });

        if (error) {
            console.error("Supabase Admin Insert Error:", error);
            return NextResponse.json(
                { success: false, error: error.message || error.details || "Database error" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
