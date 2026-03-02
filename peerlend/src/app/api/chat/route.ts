import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are PeerLend AI, the intelligent assistant for the PeerLend "Smart Capital" platform. 
Your goal is to help users navigate the dashboard, understand peer-to-peer lending, and manage their finances.

Key Platform Rules & Features:
1. Late Fees (Penalties):
   - Monthly rate is 5%.
   - Calculation: Daily pro-rata based on days late.
   - Example: 1 day late on ₹1000 (at 10% base interest, total ₹1100) = (₹1100 * 0.05 / 30) * 1 ≈ ₹1.83.
   - Distribution: 80% to investors, 20% to the platform (Admin fee).
2. Wallet & Payments:
   - Deposits and withdrawals are handled via the Wallet section.
   - We use Cashfree for secure payment processing.
3. KYC (Know Your Customer):
   - Users must complete KYC verification (Selfie + ID) to unlock borrowing and investing.
   - AI-powered matched scoring ensures identity security.
4. Lending & Borrowing:
   - Peer-to-Peer (P2P) model connecting individual borrowers with lenders.
   - "Smart Capital" means data-driven, fair, and transparent financial growth.

Guidelines:
- Tone: Premium, professional, helpful, and concise.
- Formatting: Use bold text for key terms and bullet points for lists.
- Error Handling: If you don't know something specific about a user's account, advise them to check their Dashboard or contact support at support@peerlend.live.
- Safety: Do not provide real financial advice. Always state that lending involves risk.
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // 1. Validate API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("PeerLend AI Error: GEMINI_API_KEY is missing from environment.");
            return NextResponse.json({
                reply: "I am currently in 'Offline Mode' because the Gemini API Key is missing. Please add the GEMINI_API_KEY to your .env.local file and restart the server."
            });
        }

        // 2. Initialize SDK inside the handler (safest for Hot Reloading)
        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. Define fallback models and versions
        const modelConfigs = [
            { name: "gemini-1.5-flash", version: "v1beta" },
            { name: "gemini-1.5-flash", version: "v1" },
            { name: "gemini-2.0-flash", version: "v1beta" },
            { name: "gemini-1.5-pro", version: "v1beta" },
            { name: "gemini-pro", version: "v1" }
        ];

        let lastError = null;
        let text = "";

        // 4. Transform history into Gemini format
        const chatHistory = (history || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        // 5. Try each configuration until success
        for (const config of modelConfigs) {
            try {
                process.stdout.write(`PeerLend AI: Trying ${config.name} (${config.version})...\n`);

                const model = genAI.getGenerativeModel(
                    { model: config.name },
                    { apiVersion: config.version } as any
                );

                const chat = model.startChat({
                    history: [
                        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                        { role: "model", parts: [{ text: "Understood. I am PeerLend AI, your platform assistant." }] },
                        ...chatHistory
                    ],
                });

                const result = await chat.sendMessage(message);
                const response = await result.response;
                text = response.text();

                if (text) {
                    process.stdout.write(`PeerLend AI Success with ${config.name}\n`);
                    break;
                }
            } catch (err: any) {
                console.error(`PeerLend AI: ${config.name} failed:`, err.message);
                lastError = err;
            }
        }

        if (!text && lastError) {
            throw lastError;
        }

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Gemini API Error (Detailed):', {
            message: error.message,
            stack: error.stack,
            status: error.status,
            name: error.name
        });
        return NextResponse.json({
            error: 'Failed to process chat message',
            details: error.message
        }, { status: 500 });
    }
}
