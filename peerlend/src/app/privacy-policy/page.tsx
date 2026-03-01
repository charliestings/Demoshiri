"use client";

import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Your trust is our most valuable asset. Here is how we protect your data and privacy.
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="prose prose-lg prose-rose mx-auto bg-white/50 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] border border-orange-50 shadow-sm"
                >
                    <h3>1. Introduction</h3>
                    <p>
                        Welcome to PeerLend. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                    </p>

                    <h3>2. Information We Collect</h3>
                    <p>
                        We collect personal information that you voluntarily provide to us when registering at the Service, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Service or otherwise contacting us.
                    </p>
                    <ul>
                        <li>Name and Contact Data</li>
                        <li>Credentials</li>
                        <li>Payment Data</li>
                    </ul>

                    <h3>3. How We Use Your Information</h3>
                    <p>
                        We use personal information collected via our Service for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                    </p>

                    <h3>4. Sharing Your Information</h3>
                    <p>
                        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                    </p>

                    <h3>5. Security of Your Information</h3>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>

                    <h3>6. Contact Us</h3>
                    <p>
                        If you have questions or comments about this policy, you may email us at <span className="font-bold text-rose-600">privacy@peerlend.com</span>.
                    </p>
                </motion.div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    Last updated: February 2026
                </div>
            </div>
        </main>
    );
}
