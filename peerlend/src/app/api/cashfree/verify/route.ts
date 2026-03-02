import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function POST(req: Request) {
    try {
        const { order_id, user_id } = await req.json();

        if (!order_id || !user_id) {
            return NextResponse.json({ error: 'Missing order_id or user_id' }, { status: 400 });
        }

        const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
        const baseUrl = environment === 'PRODUCTION'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';

        const appId = process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY;

        if (!appId || !secretKey) {
            return NextResponse.json({ error: 'Cashfree credentials not configured' }, { status: 500 });
        }

        // Verify the order status directly with Cashfree securely from the server
        const response = await fetch(`${baseUrl}/orders/${order_id}`, {
            method: 'GET',
            headers: {
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'x-api-version': '2023-08-01',
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cashfree Verification Error:', data);
            return NextResponse.json({ error: 'Failed to verify payment with Cashfree' }, { status: response.status });
        }

        if (data.order_status === 'PAID') {
            const amount = data.order_amount;

            // Fetch detailed payment info to get payment_method and cf_payment_id
            let paymentMethod = 'unknown';
            let cfPaymentId = 'unknown';

            try {
                const paymentsResponse = await fetch(`${baseUrl}/orders/${order_id}/payments`, {
                    method: 'GET',
                    headers: {
                        'x-client-id': appId,
                        'x-client-secret': secretKey,
                        'x-api-version': '2023-08-01',
                    }
                });

                if (paymentsResponse.ok) {
                    const payments = await paymentsResponse.json();
                    if (Array.isArray(payments) && payments.length > 0) {
                        // Get the latest successful payment
                        const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS') || payments[0];
                        cfPaymentId = successfulPayment.cf_payment_id;
                        paymentMethod = successfulPayment.payment_group || 'other';
                    }
                }
            } catch (pErr) {
                console.warn('Failed to fetch detailed payment info:', pErr);
            }

            // Create an authenticated client scoped to the user's JWT token
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) {
                return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
            }

            const supabaseClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: authHeader } } }
            );

            // 1. Log payment details for audit
            const { error: logError } = await supabaseClient
                .from('payment_details')
                .upsert({
                    user_id: user_id,
                    order_id: order_id,
                    cf_order_id: data.cf_order_id,
                    amount: amount,
                    status: data.order_status,
                    payment_method: paymentMethod,
                    cf_payment_id: cfPaymentId,
                    raw_response: data
                }, { onConflict: 'order_id' });

            if (logError) {
                console.warn('Payment logging failed (non-critical):', logError);
            }

            // 2. Execute the deposit using the user's authenticated context so auth.uid() works
            const { data: depositData, error: depositError } = await supabaseClient.rpc('deposit_funds', {
                amount_to_add: amount
            });

            if (depositError) {
                console.error('Database Update Error:', depositError);
                return NextResponse.json({ error: depositError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: 'Payment verified and wallet funded', amount });
        } else {
            return NextResponse.json({ success: false, message: `Payment status is ${data.order_status}` });
        }

    } catch (error: any) {
        console.error('Verify Order API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
