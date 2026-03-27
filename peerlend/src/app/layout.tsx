import type { Metadata } from "next";
import { Space_Grotesk, Inter, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "PeerLend - Platinum Edition",
  description: "Borrow and Invest with complete transparency on a state-of-the-art P2P platform.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

import { ChatBot } from "@/components/dashboard/ChatBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${outfit.variable} ${playfair.variable} antialiased bg-background text-foreground min-h-screen font-inter overflow-x-hidden`}
      >
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{
            __html: `console.log("%c[PeerLend Diagnostic] Supabase URL: " + (process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING"), "color: #f97316; font-weight: bold;")`
          }} />
        )}
        {children}
        <ChatBot />
      </body>
    </html>
  );
}


