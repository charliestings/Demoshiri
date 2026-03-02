import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI


const SYSTEM_PROMPT = `
You are PeerLend AI, the intelligent assistant for the PeerLend "Smart Capital" platform. 
Your goal is to help users navigate the dashboard, understand peer-to-peer lending, and manage their finances.

Key Platform Rules:
1. Late Fees: 5% monthly rate, calculated daily pro-rata.
2. Wallet: Uses Cashfree for secure payments.
3. KYC: Required to borrow or invest.
4. Model: Peer-to-Peer lending connecting borrowers and lenders.

Tone: Professional, helpful, and concise.
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // 1. Clean up API Key
        const apiKey = (process.env.GEMINI_API_KEY || '').trim();
        if (!apiKey) {
            return NextResponse.json({ reply: "API Key missing. Please add GEMINI_API_KEY to .env.local" });
        }

        const modelNames = ["gemini-1.5-flash", "gemini-pro"];
        let text = "";
        let lastErrorMsg = "";

        // 2. Try Direct Fetch (More robust against SDK URL issues)
        for (const model of modelNames) {
            try {
                process.stdout.write(`PeerLend AI: Trying Fetch for ${model}...\n`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                            { role: "model", parts: [{ text: "Understood. I am your assistant." }] },
                            ...(history || []).map((h: any) => ({
                                role: h.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: h.content }]
                            })),
                            { role: "user", parts: [{ text: message }] }
                        ]
                    })
                });

                const data = await response.json();
                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    text = data.candidates[0].content.parts[0].text;
                    process.stdout.write(`PeerLend AI: Success with ${model} via Fetch\n`);
                    break;
                } else {
                    lastErrorMsg = data.error?.message || response.statusText || "Unknown Error";
                    process.stdout.write(`PeerLend AI: Fetch failed for ${model}: ${lastErrorMsg}\n`);
                }
            } catch (err: any) {
                lastErrorMsg = err.message;
            }
        }

        // 3. Last Fallback: Try SDK (Standard)
        if (!text) {
            try {
                process.stdout.write(`PeerLend AI: Trying SDK Fallback...\n`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(message);
                text = result.response.text();
            } catch (sdkErr: any) {
                process.stdout.write(`PeerLend AI: SDK Fallback also failed: ${sdkErr.message}\n`);
                throw new Error(lastErrorMsg || sdkErr.message);
            }
        }

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('PeerLend AI Final Error:', error.message);
        return NextResponse.json({
            error: 'Failed to process chat message',
            details: error.message
        }, { status: 500 });
    }
}
