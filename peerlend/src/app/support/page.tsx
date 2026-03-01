"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Search, HelpCircle, ShieldCheck, Zap, ArrowRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const faqs = [
    {
        category: "Getting Started",
        items: [
            { q: "How do I start investing?", a: "Simply sign up, verify your identity, and browse the Loan Market. You can start with as little as $50." },
            { q: "Is there a minimum credit score to borrow?", a: "We look at more than just credit scores. Our holistic evaluation considers income, stability, and education." },
            { q: "How long does verification take?", a: "Most accounts are verified instantly. In some cases, it may take up to 24 hours." }
        ]
    },
    {
        category: "Safety & Security",
        items: [
            { q: "Is my money safe?", a: "We use bank-grade encryption and partner with regulated entities to hold funds. Your capital is protected by our Reserve Fund." },
            { q: "What happens if a borrower defaults?", a: "Our Recovery Team steps in immediately. Plus, our Diversification Tool spreads your risk across many loans." }
        ]
    },
    {
        category: "Fees & Charges",
        items: [
            { q: "Are there any hidden fees?", a: "Never. We charge a flat service fee on successful loan repayments only. No signup or maintenance fees." },
            { q: "Can I withdraw my money anytime?", a: "Yes, you can withdraw uninvested cash instantly. Invested funds are returned as borrowers repay." }
        ]
    }
];

function FAQItem({ q, a }: { q: string, a: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-rose-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-6 text-left group"
            >
                <span className="font-bold text-slate-900 text-lg group-hover:text-rose-600 transition-colors">{q}</span>
                <span className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full border border-rose-200 flex items-center justify-center text-rose-500 transition-all ${isOpen ? 'rotate-45 bg-rose-50' : 'bg-white'}`}>
                    +
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="text-slate-600 pb-6 leading-relaxed font-medium">
                            {a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-50/50 to-transparent -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-100 shadow-sm mb-6"
                    >
                        <HelpCircle className="h-4 w-4 text-rose-500" />
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Help Center</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-rose-950 mb-8 font-outfit">
                        How can we help?
                    </h1>

                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full h-16 pl-16 pr-6 rounded-full border-2 border-orange-100 bg-white/80 backdrop-blur-sm focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 shadow-lg shadow-orange-500/5 text-lg font-medium text-slate-900 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="px-6 pb-12">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                    {[
                        { icon: Zap, title: "Quick Start", desc: "Guides to get you up and running." },
                        { icon: ShieldCheck, title: "Trust & Safety", desc: "How we protect your capital." },
                        { icon: MessageCircle, title: "Community", desc: "Tips from our top lenders." },
                    ].map((c, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-orange-50 hover:shadow-xl hover:shadow-orange-500/5 transition-all group cursor-pointer hover:-translate-y-1"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <c.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{c.title}</h3>
                            <p className="text-slate-500 font-medium mb-4">{c.desc}</p>
                            <span className="text-rose-600 font-bold text-sm flex items-center group-hover:gap-2 transition-all">
                                View Articles <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FAQs */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto space-y-16">
                    {faqs.map((cat, i) => (
                        <div key={i}>
                            <h2 className="text-2xl font-black text-rose-950 mb-8 font-outfit">{cat.category}</h2>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-rose-50">
                                {cat.items.map((item, j) => (
                                    <FAQItem key={j} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="pb-24 px-6">
                <div className="max-w-4xl mx-auto bg-rose-950 rounded-[3rem] p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white mb-4">Still can't find the answer?</h2>
                        <p className="text-white/70 mb-8 font-medium">Our support team is just a message away.</p>
                        <Link href="/contact">
                            <Button className="h-14 px-8 rounded-full bg-white text-rose-950 hover:bg-rose-50 font-bold text-lg">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                    {/* Decor */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] -ml-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] -mr-20 -mb-20 pointer-events-none" />
                </div>
            </section>

        </main>
    );
}
