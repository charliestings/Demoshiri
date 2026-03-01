"use client";

import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function TermsOfService() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900 font-inter">
            <Navbar />


            <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-gradient-to-br from-orange-200/30 via-rose-200/20 to-transparent rounded-full blur-[120px] mix-blend-multiply opacity-70" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[800px] h-[800px] bg-gradient-to-tr from-rose-200/30 via-pink-200/20 to-transparent rounded-full blur-[100px] mix-blend-multiply opacity-70" />
            </div>

            <div className="max-w-4xl mx-auto px-6 pt-40 pb-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-4 block">Legal</span>
                    <h1 className="text-4xl md:text-5xl font-black text-rose-950 font-outfit mb-6">
                        Terms of Service
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Please read these terms carefully before using our service.
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="prose prose-lg prose-rose mx-auto bg-white/50 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] border border-orange-50 shadow-sm"
                >
                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing or using PeerLend ("Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                    </p>

                    <h3>2. Accounts</h3>
                    <p>
                        When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>

                    <h3>3. Intellectual Property</h3>
                    <p>
                        The Service and its original content, features, and functionality are and will remain the exclusive property of PeerLend and its licensors.
                    </p>

                    <h3>4. Links To Other Web Sites</h3>
                    <p>
                        Our Service may contain links to third-party web sites or services that are not owned or controlled by PeerLend. PeerLend has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
                    </p>

                    <h3>5. Termination</h3>
                    <p>
                        We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h3>6. Limitation of Liability</h3>
                    <p>
                        In no event shall PeerLend, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>

                    <h3>7. Changes</h3>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
                    </p>

                    <h3>8. Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us at <span className="font-bold text-rose-600">legal@peerlend.com</span>.
                    </p>
                </motion.div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    Last updated: February 2026
                </div>
            </div>
        </main>
    );
}
