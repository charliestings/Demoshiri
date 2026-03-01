import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { amount, userId } = await req.json();

        if (!amount || amount <= 0 || !userId) {
            return NextResponse.json({ error: 'Invalid amount or user ID' }, { status: 400 });
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

        // Generate a unique order ID
        const orderId = `ORDER_${userId.replace(/-/g, '').substring(0, 10)}_${Date.now()}`;

        // Prepare the Cashfree order payload
        const payload = {
            order_amount: amount,
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: userId.replace(/-/g, '').substring(0, 20), // Cashfree has char limits
                customer_phone: '9999999999', // Dummy phone for seamless checkout without SMS if not needed
                customer_name: 'PeerLend User'
            },
            order_meta: {
                // Not strictly used by seamless flow but good practice
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id={order_id}`
            }
        };

        const response = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'x-api-version': '2023-08-01',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cashfree Order Error:', data);
            return NextResponse.json({ error: data.message || 'Failed to create Cashfree order' }, { status: response.status });
        }

        return NextResponse.json({
            payment_session_id: data.payment_session_id,
            order_id: data.order_id
        });

    } catch (error: any) {
        console.error('Create Order API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
