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

        // 2. Define combinations to try
        const modelNames = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-2.0-flash-exp"];
        const apiVersions = ["v1", "v1beta"];

        let text = "";
        let lastErrorMsg = "";

        // 3. Try Combinations via Direct Fetch
        for (const model of modelNames) {
            for (const version of apiVersions) {
                try {
                    process.stdout.write(`PeerLend AI: Trying ${model} on ${version}...\n`);
                    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                                { role: "model", parts: [{ text: "Understood. I am PeerLend AI Assistant." }] },
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
                        process.stdout.write(`PeerLend AI: SUCCESS with ${model} on ${version}!\n`);
                        return NextResponse.json({ reply: text });
                    } else {
                        lastErrorMsg = data.error?.message || response.statusText || "Unknown Error";
                        process.stdout.write(`PeerLend AI: FAILED for ${model}/${version}: ${lastErrorMsg}\n`);
                    }
                } catch (err: any) {
                    lastErrorMsg = err.message;
                }
            }
        }

        // 4. If all fail, return the last error
        throw new Error(lastErrorMsg || "No models responded successfully");

    } catch (error: any) {
        console.error('PeerLend AI Final Error:', error.message);
        return NextResponse.json({
            error: 'Failed to process chat message',
            details: error.message
        }, { status: 500 });
    }
}
