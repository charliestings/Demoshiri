"use client";

import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function CookiesPolicy() {
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
                        Cookie Policy
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        How we use cookies to improve your experience.
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="prose prose-lg prose-rose mx-auto bg-white/50 backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] border border-orange-50 shadow-sm"
                >
                    <h3>1. What Are Cookies?</h3>
                    <p>
                        Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                    </p>

                    <h3>2. How We Use Cookies</h3>
                    <p>
                        When you use and access the Service, we may place a number of specific cookies files in your web browser. We use cookies for the following purposes:
                    </p>
                    <ul>
                        <li>To enable certain functions of the Service</li>
                        <li>To provide analytics</li>
                        <li>To store your preferences</li>
                    </ul>

                    <h3>3. Types of Cookies We Use</h3>
                    <p>
                        We use both session and persistent cookies on the Service and we use different types of cookies to run the Service:
                    </p>
                    <ul>
                        <li><strong>Essential cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.</li>
                        <li><strong>Analytics cookies:</strong> We may use analytics cookies to track information how the Service is used so that we can make improvements.</li>
                    </ul>

                    <h3>4. Your Choices Regarding Cookies</h3>
                    <p>
                        If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
                    </p>

                    <h3>5. Contact Us</h3>
                    <p>
                        If you have any questions about our Cookie Policy, please contact us at <span className="font-bold text-rose-600">privacy@peerlend.com</span>.
                    </p>
                </motion.div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    Last updated: February 2026
                </div>
            </div>
        </main>
    );
}
