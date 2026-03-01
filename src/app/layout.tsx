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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${outfit.variable} ${playfair.variable} antialiased bg-background text-foreground min-h-screen font-inter`}
      >
        {children}
      </body>
    </html>
  );
}


