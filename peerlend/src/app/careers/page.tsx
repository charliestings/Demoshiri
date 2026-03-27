"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Coffee, Laptop, Smile, BriefcaseBusiness } from "lucide-react";

export default function CareersPage() {
    const scrollToRoles = () => {
        document.getElementById("open-roles")?.scrollIntoView({ behavior: "smooth" });
    };

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
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">Careers</span>
                    <h1 className="text-5xl md:text-7xl font-black text-rose-950 mb-8 font-outfit leading-tight">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Sunshine.</span>
                    </h1>
                    <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
                        We're building the future of peer-to-peer finance, and we're looking for kind, ambitious people to help us do it.
                    </p>
                    <Button
                        onClick={scrollToRoles}
                        size="lg"
                        className="h-16 px-10 rounded-full font-bold text-lg bg-rose-950 text-white hover:bg-rose-900 shadow-xl shadow-rose-900/20"
                    >
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
            <section id="open-roles" className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black text-rose-950 mb-12 font-outfit">Open Positions</h2>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[2rem] border-2 border-dashed border-orange-100 p-16 text-center"
                    >
                        <div className="h-20 w-20 mx-auto bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-orange-400 mb-6">
                            <BriefcaseBusiness className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3">No open positions right now</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                            We don&apos;t have any open roles at the moment, but we&apos;re always growing. Check back soon!
                        </p>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}
