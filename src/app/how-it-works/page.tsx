"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ShieldCheck,
    ArrowRight,
    TrendingUp,
    Users,
    Search,
    Zap,
    CheckCircle2,
    ArrowLeft,
    PiggyBank,
    HandCoins
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HowItWorksPage() {
    const [view, setView] = useState<"borrower" | "lender">("lender");

    const lenderSteps = [
        {
            id: "01",
            title: "Deposit Funds",
            desc: "Add capital to your secure PeerLend wallet. Your funds are protected by bank-level encryption.",
            icon: Wallet,
            color: "rose"
        },
        {
            id: "02",
            title: "Explore Loans",
            desc: "Browse vetted loan requests. Each borrower is verified through our multi-step platform audit.",
            icon: Search,
            color: "orange"
        },
        {
            id: "03",
            title: "Start Earning",
            desc: "Invest in loans and watch your portfolio grow. Receive monthly repayments directly to your wallet.",
            icon: TrendingUp,
            color: "pink"
        }
    ];

    const borrowerSteps = [
        {
            id: "01",
            title: "Request a Loan",
            desc: "Submit your financing request with clear terms. Our system analyzes your profile instantly.",
            icon: HandCoins,
            color: "orange"
        },
        {
            id: "02",
            title: "Get Verified",
            desc: "Complete our digital verification process. Your request goes live as soon as it's approved.",
            icon: ShieldCheck,
            color: "rose"
        },
        {
            id: "03",
            title: "Receive Funds",
            desc: "Once your goal is met, funds are dispersed instantly. Repay through flexible monthly plans.",
            icon: Zap,
            color: "indigo"
        }
    ];

    const steps = view === "lender" ? lenderSteps : borrowerSteps;

    return (
        <main className="min-h-screen bg-slate-50 relative overflow-hidden">
            <Navbar />

            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/50 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-100 shadow-sm mb-6"
                    >
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">The Future of Finance</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                        How <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600">PeerLend</span> Works
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        We've removed the complexity of traditional banking.
                        Choose your journey and see how PeerLend empowers you.
                    </p>
                </div>

                {/* View Switcher */}
                <div className="flex justify-center mb-20">
                    <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex gap-2">
                        <button
                            onClick={() => setView("lender")}
                            className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${view === "lender"
                                    ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg"
                                    : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <PiggyBank className="h-5 w-5" />
                            I want to Invest
                        </button>
                        <button
                            onClick={() => setView("borrower")}
                            className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${view === "borrower"
                                    ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg"
                                    : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <HandCoins className="h-5 w-5" />
                            I want to Borrow
                        </button>
                    </div>
                </div>

                {/* Steps Section */}
                <div className="grid lg:grid-cols-3 gap-10">
                    <AnimatePresence mode="wait">
                        {steps.map((step, index) => (
                            <motion.div
                                key={`${view}-${step.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                <div className="absolute -top-6 -left-4 text-7xl font-black text-slate-200/50 group-hover:text-rose-200/50 transition-colors duration-500 -z-10">
                                    {step.id}
                                </div>
                                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50 h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                    <div className={`h-16 w-16 rounded-2xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center mb-8 shadow-inner`}>
                                        <step.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Trust & Security Section */}
                <section className="mt-32 p-12 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="flex items-center gap-3 text-emerald-400 mb-6 bg-emerald-400/10 w-fit px-4 py-1.5 rounded-full border border-emerald-400/20">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-wider">Bank-Grade Security</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-6">Your safety is our <br />absolute priority.</h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                We utilize Row-Level Security (RLS) to ensure that your private financial data
                                is only visible to you. Every borrower undergoes a rigorous digital verification process before being allowed on our market.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-orange-500 mt-1" />
                                    <div>
                                        <h4 className="font-bold">Encrypted Data</h4>
                                        <p className="text-sm text-slate-500">AES-256 bit encryption for all records.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-rose-500 mt-1" />
                                    <div>
                                        <h4 className="font-bold">Verified Market</h4>
                                        <p className="text-sm text-slate-500">Every loan request is manually audited.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-3xl">
                            <div className="space-y-6">
                                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-rose-600/10 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protection Level</span>
                                        <span className="text-emerald-400 text-xs font-bold">MAXIMUM</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5 }}
                                            className="h-full bg-gradient-to-r from-orange-500 to-rose-600"
                                        />
                                    </div>
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                                    alt="Security"
                                    className="rounded-2xl opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <div className="text-center mt-32">
                    <h2 className="text-3xl font-black text-slate-900 mb-8">Ready to transform your finances?</h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link href="/dashboard">
                            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-600 text-white h-16 px-12 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-all">
                                Go to Dashboard <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" size="lg" className="h-16 px-12 rounded-full text-xl font-bold border-2 border-slate-200 hover:bg-slate-100 transition-all">
                                <ArrowLeft className="mr-2 h-6 w-6" />
                                Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer Copy */}
            <footer className="py-12 border-t border-slate-200 bg-white/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 font-medium">
                    © 2026 PeerLend Inc. Dedicated to transparent peer-to-peer capital.
                </div>
            </footer>
        </main>
    );
}
