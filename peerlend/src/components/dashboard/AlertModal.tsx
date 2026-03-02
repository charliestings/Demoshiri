"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Info,
    AlertTriangle,
    X,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
}

export function AlertModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel'
}: AlertModalProps) {
    if (!isOpen) return null;

    const iconMap = {
        info: <Info className="h-10 w-10 text-blue-500" />,
        success: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
        warning: <AlertTriangle className="h-10 w-10 text-orange-500" />,
        error: <AlertCircle className="h-10 w-10 text-rose-500" />,
        confirm: <HelpCircle className="h-10 w-10 text-indigo-500" />
    };

    const colorMap = {
        info: "bg-blue-50 border-blue-100",
        success: "bg-emerald-50 border-emerald-100",
        warning: "bg-orange-50 border-orange-100",
        error: "bg-rose-50 border-rose-100",
        confirm: "bg-indigo-50 border-indigo-100"
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
                >
                    <div className="p-8 text-center">
                        {/* Icon */}
                        <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm ${colorMap[type]}`}>
                            {iconMap[type]}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed px-2">
                            {message}
                        </p>

                        <div className="flex gap-3">
                            {type === 'confirm' ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1 rounded-2xl border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px] py-6 hover:bg-slate-50 transition-all"
                                    >
                                        {cancelText}
                                    </Button>
                                    <Button
                                        onClick={handleConfirm}
                                        className="flex-1 bg-slate-900 hover:bg-black text-white rounded-2xl py-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]"
                                    >
                                        {confirmText}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={onClose}
                                    className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl py-7 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02]"
                                >
                                    {confirmText}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Subtle aesthetic footer */}
                    <div className="h-1.5 w-full bg-slate-50 flex">
                        <div className={`h-full w-1/3 opacity-50 ${type === 'error' ? 'bg-rose-500' : type === 'success' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        <div className={`h-full w-1/3 opacity-30 ${type === 'error' ? 'bg-rose-500' : type === 'success' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        <div className={`h-full w-1/3 opacity-10 ${type === 'error' ? 'bg-rose-500' : type === 'success' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
