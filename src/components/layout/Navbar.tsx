"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-6"
        >
            <div className="mx-auto max-w-7xl glass-card px-8 py-4 flex items-center justify-between bg-white/80 border-white/60 shadow-lg shadow-rose-900/5">
                <Link href="/" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <span className="font-bold text-xl">P</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-indigo-950">PeerLend</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/invest" className="text-indigo-900/70 hover:text-rose-600 transition-colors text-sm font-medium">Invest</Link>
                    <Link href="/borrow" className="text-indigo-900/70 hover:text-rose-600 transition-colors text-sm font-medium">Borrow</Link>
                    <Link href="/how-it-works" className="text-indigo-900/70 hover:text-rose-600 transition-colors text-sm font-medium">how it works</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="hidden sm:inline-flex text-indigo-900 hover:text-rose-600 hover:bg-rose-50 rounded-full px-6">
                            Log in
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button className="bg-gradient-to-r from-orange-600 to-rose-600 text-white hover:opacity-90 shadow-xl shadow-rose-500/30 transition-all rounded-full px-8 h-12">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.header>
    );
}
