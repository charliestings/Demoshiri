"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { notifyAdminsOfMessage } from "@/app/actions/contact";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("General Inquiry");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !message) return;
        
        setIsSubmitting(true);
        const { error } = await supabase.from('contact_messages').insert({
            name, email, subject, message
        });

        if (!error) {
            // Use Server Action to securely bypass RLS and notify admins
            await notifyAdminsOfMessage(name, subject);

            setIsSubmitting(false);
            setIsSuccess(true);
            setName(""); setEmail(""); setMessage(""); setSubject("General Inquiry");
            setTimeout(() => setIsSuccess(false), 5000);
        } else {
            setIsSubmitting(false);
            console.error("Submission error:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    return (
        <main className="min-h-screen bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900">
            <Navbar />

            {/* Header */}
            <section className="pt-40 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">We&apos;re Here for You</span>
                    <h1 className="text-5xl md:text-7xl font-black text-rose-950 mb-8 font-outfit leading-tight">
                        Get in Touch.
                    </h1>
                    <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto">
                        Whether you have a question about investing, borrowing, or just want to say hi, our team is ready to help.
                    </p>
                </motion.div>
            </section>

            {/* Content Grid */}
            <section className="pb-32 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-24">

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-12"
                    >
                        <div>
                            <h3 className="text-2xl font-black text-rose-900 mb-6 font-outfit">Contact Info</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Email Us</p>
                                        <a href="mailto:support@peerlend.com" className="text-slate-600 hover:text-rose-600 transition-colors">support@peerlend.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Call Us</p>
                                        <p className="text-slate-600 font-mono">+1 (555) 123-4567</p>
                                        <p className="text-xs text-slate-400 mt-1">Mon-Fri, 9am - 6pm PST</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Visit Us</p>
                                        <p className="text-slate-600">
                                            Cyber Stings<br />
                                            Salem
                                            
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-500 to-rose-600 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-black text-2xl mb-2">Need immediate help?</h4>
                                <p className="text-white/80 mb-6 text-sm">Check our Support Center for quick answers onto common questions.</p>
                                <a href="/support">
                                    <Button className="bg-white text-rose-600 hover:bg-rose-50 rounded-full font-bold w-full">
                                        Go to Support Center
                                    </Button>
                                </a>
                            </div>
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-[2.5rem] shadow-xl shadow-rose-900/5 border border-rose-100 p-8 md:p-10 relative overflow-hidden"
                    >
                        {isSuccess && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-2xl shadow-emerald-500/20">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="text-3xl font-black text-rose-950 mb-3 font-outfit">Message Sent!</h3>
                                <p className="text-slate-600 font-medium text-lg">Thank you for reaching out. We have received your message and will reply to your email shortly.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-medium text-slate-900" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-medium text-slate-900" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                                <select 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-medium text-slate-900 appearance-none"
                                >
                                    <option>General Inquiry</option>
                                    <option>Borrowing Help</option>
                                    <option>Investment Question</option>
                                    <option>Partnership</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message</label>
                                <textarea 
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="How can we help you?" 
                                    rows={5} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-medium text-slate-900 resize-none" 
                                />
                            </div>

                            <Button disabled={isSubmitting} type="submit" className="w-full h-14 bg-rose-950 text-white hover:bg-rose-900 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                                {isSubmitting ? "Sending..." : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </form>
                    </motion.div>

                </div>
            </section>
        </main>
    );
}
