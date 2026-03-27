import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        // 2. Initialize the Gemini AI SDK
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT
        });


        const formattedHistory = (history || []).map((h: { role: string; content: string }) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        const validHistory: { role: string; parts: { text: string }[] }[] = [];
        for (const msg of formattedHistory) {
            if (validHistory.length === 0) {
                if (msg.role === 'model') {
                    validHistory.push({ role: 'user', parts: [{ text: 'Hello' }] });
                }
                validHistory.push(msg);
            } else {
                if (validHistory[validHistory.length - 1].role !== msg.role) {
                    validHistory.push(msg);
                } else {
                    validHistory[validHistory.length - 1].parts[0].text += `\n${msg.parts[0].text}`;
                }
            }
        }

        const chat = model.startChat({
            history: validHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to process chat message";
        console.error('PeerLend AI Final Error:', errorMessage);

        // Check for Quota Exceeded (429)
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Rate limit')) {
            return NextResponse.json({
                error: 'AI Quota Exceeded',
                details: "The AI assistant is currently at its free tier limit. Please try again in a few minutes or tomorrow. We apologize for the inconvenience!",
                retryAfter: 60 // Informational
            }, { status: 429 });
        }

        return NextResponse.json({
            error: 'Failed to process chat message',
            details: errorMessage
        }, { status: 500 });
    }
}
