"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, ExternalLink, Newspaper } from "lucide-react";

export default function PressPage() {
    return (
        <main className="min-h-screen bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">Newsroom</span>
                    <h1 className="text-5xl md:text-7xl font-black text-rose-950 mb-8 font-outfit leading-tight">
                        Making <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">headlines.</span>
                    </h1>
                </motion.div>
            </section>

            {/* Featured Articles */}
            <section className="pb-32 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { source: "TechCrunch", date: "Oct 12, 2025", title: "PeerLend raises $10M Series A to bring sunshine to finance." },
                        { source: "Forbes", date: "Sep 28, 2025", title: "The new wave of P2P lending is human-first." },
                        { source: "Bloomberg", date: "Aug 15, 2025", title: "Why Gen Z is ditching traditional banks for PeerLend." },
                    ].map((article, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-orange-50 hover:shadow-xl hover:shadow-orange-500/10 transition-all group cursor-pointer flex flex-col justify-between h-full"
                        >
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4">{article.source} • {article.date}</p>
                                <h3 className="text-2xl font-bold text-rose-950 leading-tight group-hover:text-rose-600 transition-colors">{article.title}</h3>
                            </div>
                            <div className="mt-8 flex items-center text-sm font-bold text-slate-400 group-hover:text-rose-600 transition-colors">
                                Read Article <ExternalLink className="ml-2 h-4 w-4" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Brand Assets */}
            <section className="py-20 px-6 bg-white/50 border-t border-orange-50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-rose-950 mb-4 font-outfit">Brand Assets</h2>
                        <p className="text-slate-600 font-medium max-w-md">Need our logo or product screenshots? Download our official media kit.</p>
                    </div>
                    <Button size="lg" className="h-14 px-8 rounded-full bg-rose-950 text-white hover:bg-rose-900 font-bold shadow-lg">
                        <Download className="mr-2 h-5 w-5" /> Download Media Kit (ZIP)
                    </Button>
                </div>
            </section>

        </main>
    );
}
