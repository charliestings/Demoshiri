"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters";

interface TransactionSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    amount: number;
    description: string;
    onViewWallet: () => void;
}

export function TransactionSuccessModal({
    isOpen,
    onClose,
    title,
    amount,
    description,
    onViewWallet
}: TransactionSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    {/* Top Decorative Pattern */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10" />

                    <div className="p-8 pt-12 text-center relative z-10">
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, delay: 0.2 }}
                            className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner"
                        >
                            <CheckCircle2 className="h-10 w-10" />
                        </motion.div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                            {title}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">
                            {description}
                        </p>

                        <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                Amount Processed
                            </span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter italic">
                                {formatINR(amount)}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    onViewWallet();
                                    onClose();
                                }}
                                className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl py-7 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02]"
                            >
                                <Wallet className="h-4 w-4" />
                                Go to My Wallet
                                <ArrowRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs py-4"
                            >
                                Close
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Progress Bar (Visual Only) */}
                    <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
