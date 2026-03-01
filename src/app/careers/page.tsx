"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, Laptop, Smile } from "lucide-react";
import Link from "next/link";

const jobs = [
    { title: "Senior Frontend Engineer", team: "Product Engineering", location: "Remote (US/EU)" },
    { title: "Product Designer", team: "Design", location: "Los Angeles, CA" },
    { title: "Growth Marketing Manager", team: "Marketing", location: "New York, NY" },
    { title: "Customer Success Lead", team: "Support", location: "Remote" }
];

export default function CareersPage() {
    return (
        <main className="min-h-screen bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">We're Hiring</span>
                    <h1 className="text-5xl md:text-7xl font-black text-rose-950 mb-8 font-outfit leading-tight">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Sunshine.</span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
                        We're building the future of peer-to-peer finance, and we're looking for kind, ambitious people to help us do it.
                    </p>
                    <Button size="lg" className="h-16 px-10 rounded-full font-bold text-lg bg-rose-950 text-white hover:bg-rose-900 shadow-xl shadow-rose-900/20">
                        View Open Roles
                    </Button>
                </motion.div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-6 bg-white border-y border-orange-50">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center">
                    {[
                        { icon: Laptop, title: "Remote-First", desc: "Work from where you feel most inspired. We trust you to do your best work." },
                        { icon: Smile, title: "Wellness Budget", desc: "$200/month for gym, therapy, or whatever keeps you glowing." },
                        { icon: Coffee, title: "Regular Retreats", desc: "We fly the whole team to a sunny location twice a year to connect IRL." }
                    ].map((ben, i) => (
                        <div key={i} className="group">
                            <div className="h-16 w-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                                <ben.icon className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{ben.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{ben.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Open Roles */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-rose-950 mb-12 font-outfit">Open Positions</h2>
                    <div className="space-y-4">
                        {jobs.map((job, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group bg-white p-8 rounded-[2rem] border border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer"
                            >
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">{job.title}</h3>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-400">{job.team} • {job.location}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white transition-all">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
