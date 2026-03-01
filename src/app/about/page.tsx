"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, Target, Heart, Globe } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
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
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">Our Story</span>
                    <h1 className="text-5xl md:text-7xl font-black text-rose-950 mb-8 font-outfit leading-tight">
                        Reimagining finance,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">one connection at a time.</span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                        We started PeerLend with a simple belief: the financial system should work for people, not just institutions. By cutting out the middleman, we bring sunlight to your money.
                    </p>
                </motion.div>
            </section>

            {/* Stats/Image Grid */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-900/10"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
                            alt="Team working together"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-4xl font-black font-outfit mb-2">2023</p>
                            <p className="font-medium text-white/80">Year Founded</p>
                        </div>
                    </motion.div>

                    <div className="space-y-8">
                        {[
                            { num: "$50M+", label: "Loans Funded" },
                            { num: "45k+", label: "Active Investors" },
                            { num: "0", label: "Hidden Fees" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 rounded-[2rem] border border-orange-50 shadow-sm flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-4xl font-black text-rose-950 font-outfit">{stat.num}</p>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{stat.label}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                    <Target className="h-6 w-6" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-32 px-6 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-4 block">Our Values</span>
                        <h2 className="text-4xl font-black text-rose-950 font-outfit">What drives us forward</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { icon: Users, title: "People First", desc: "Technology is just the tool. Human connection is the goal." },
                            { icon: Globe, title: "Radical Transparency", desc: "No black boxes. You see exactly where your money goes." },
                            { icon: Heart, title: "Win-Win Growth", desc: "We only succeed when our community succeeds together." }
                        ].map((val, i) => (
                            <div key={i} className="text-center">
                                <div className="h-20 w-20 mx-auto bg-gradient-to-br from-orange-100 to-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mb-8 transform rotate-3 hover:rotate-6 transition-transform">
                                    <val.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-rose-950 mb-4">{val.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium">{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
