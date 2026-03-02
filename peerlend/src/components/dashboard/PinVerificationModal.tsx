"use client";

import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Lock, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface PinVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
    actionLabel?: string;
}

export function PinVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    title = "Verify Transaction PIN",
    description = "Enter your 6-digit security PIN to authorize this transaction.",
    actionLabel = "Confirm PIN"
}: PinVerificationModalProps) {
    const [pin, setPin] = useState<string[]>(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin(new Array(6).fill(""));
            setError(null);
            setIsSuccess(false);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleChange = (value: string, index: number) => {
        if (isNaN(Number(value))) return;

        const newPin = [...pin];
        newPin[index] = value.substring(value.length - 1);
        setPin(newPin);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const data = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newPin = [...pin];
        data.split("").forEach((char, i) => {
            if (i < 6) newPin[i] = char;
        });
        setPin(newPin);
        inputRefs.current[Math.min(data.length, 5)]?.focus();
    };

    const handleVerify = async () => {
        const fullPin = pin.join("");
        if (fullPin.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('verify_transaction_pin', {
                input_pin: fullPin
            });

            if (rpcError) throw rpcError;

            if (data?.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 800);
            } else {
                setError(data?.error || "Incorrect PIN. Please try again.");
                setPin(new Array(6).fill(""));
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            console.error("PIN verification error:", err);
            setError(err.message || "An error occurred during verification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && !isSuccess && !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl overflow-hidden p-0 bg-white">
                <div className="bg-slate-900 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        disabled={loading || isSuccess}
                        className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col items-center text-center">
                        <div className="h-14 w-14 bg-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
                            <Shield className="h-7 w-7 text-white" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">{title}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm mt-2">
                            {description}
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el: HTMLInputElement | null) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                disabled={loading || isSuccess}
                                className={`w-10 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all outline-none
                                    ${digit ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-slate-50/50'}
                                    ${error ? 'border-rose-500 bg-rose-50 text-rose-600' : 'focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'}
                                    ${isSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : ''}
                                `}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"
                            >
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-bold">{error}</span>
                            </motion.div>
                        )}
                        {isSuccess && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Verification Successful</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        onClick={handleVerify}
                        disabled={loading || isSuccess || pin.some(d => !d)}
                        className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-14 font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Lock className="h-4 w-4" />
                                </motion.div>
                                Verifying...
                            </div>
                        ) : (
                            actionLabel
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tighter">
                        Protected by PeerLend Secure Transaction Protocol
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
