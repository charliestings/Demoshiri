"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    ChevronDown,
    Clock,
    CreditCard,
    ShieldCheck,
    Info,
    RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/formatters";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function ChatBot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [showPopUp, setShowPopUp] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hi! I'm PeerLend AI. How can I help you today? You can ask me about late fees, how to repay a loan, or platform security.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setShowPopUp(false);
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (pathname === "/" && !isOpen) {
            const showTimer = setTimeout(() => setShowPopUp(true), 1500);
            const hideTimer = setTimeout(() => setShowPopUp(false), 8000); // Disappear after 8s total
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        } else {
            setShowPopUp(false);
        }
    }, [pathname, isOpen]);

    const handleReset = () => {
        setMessages([
            {
                id: Date.now().toString(),
                role: "assistant",
                content: "Chat history cleared! How else can I help you with PeerLend today?",
                timestamp: new Date()
            }
        ]);
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history: messages.slice(-5) })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "Server error");
            }

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${error.message || "I'm having trouble connecting right now."} Please check your Gemini API key or try again later!`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestions = [
        { label: "Late Fees?", icon: Clock },
        { label: "Repay Loan?", icon: CreditCard },
        { label: "Is it secure?", icon: ShieldCheck },
        { label: "About PeerLend", icon: Info }
    ];

    return (
        <div className="fixed top-0 bottom-0 right-8 z-[100] font-inter pointer-events-none flex flex-col justify-end pb-8">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-[440px] h-screen bg-slate-900 border-x border-slate-800 shadow-[-30px_0_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto"
                    >
                        {/* Chat Header */}
                        <div className="p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-between shadow-lg relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tighter text-sm">PeerLend AI Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-white/80 uppercase">Full Session Access</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleReset}
                                    title="Reset Chat"
                                    className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    title="Close Assistant"
                                    className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6 bg-slate-950/50">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full mb-2",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "flex max-w-[92%] gap-2.5 items-start",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <div className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md border border-white/10 mt-0.5",
                                            msg.role === "user" ? "bg-orange-600" : "bg-slate-800"
                                        )}>
                                            {msg.role === "user" ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                        </div>
                                        <div className={cn(
                                            "px-4 py-3.5 rounded-2xl text-[14.5px] leading-relaxed font-medium shadow-md border whitespace-pre-wrap text-left",
                                            msg.role === "user"
                                                ? "bg-orange-600/20 text-orange-50 border-orange-500/30 rounded-tr-none"
                                                : "bg-slate-800 text-slate-200 border-slate-700/50 rounded-tl-none"
                                        )}>
                                            {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start w-full">
                                    <div className="flex gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-white/5 shadow-md">
                                            <Sparkles className="h-5 w-5 animate-pulse text-orange-400" />
                                        </div>
                                        <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 shadow-md flex gap-1.5 items-center">
                                            <div className="w-1.5 h-1.5 bg-orange-500/50 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-orange-500/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Fixed Suggestions */}
                        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 relative">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 touch-pan-x select-none">
                                {suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(s.label)}
                                        className="whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 hover:border-orange-500/50 hover:text-orange-400 transition-all hover:bg-slate-800/80 active:scale-95 shadow-sm"
                                    >
                                        <s.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Scroll Gradient Indicator */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-slate-800 bg-slate-900">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask PeerLend AI..."
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-2xl px-5 py-4 pr-14 text-sm font-medium text-white placeholder:text-slate-500 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white disabled:opacity-50 disabled:grayscale shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button Group */}
            {!isOpen && (
                <div className="flex flex-col items-end gap-4 pointer-events-auto">
                    {/* Proactive Pop-up Bubble - Premium Redesign */}
                    <AnimatePresence>
                        {showPopUp && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 40, x: 20 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: [0, -10, 0], // Floating "breathing" effect
                                    x: 0
                                }}
                                exit={{ opacity: 0, scale: 0.8, y: 40, x: 20 }}
                                transition={{
                                    y: {
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    },
                                    default: { type: "spring", damping: 20, stiffness: 150 }
                                }}
                                className="bg-white/95 backdrop-blur-xl p-5 rounded-[2rem] rounded-br-[0.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-2 border-orange-100/50 max-w-[280px] relative mb-4 cursor-pointer group"
                                onClick={() => setIsOpen(true)}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowPopUp(false); }}
                                    className="absolute -top-3 -left-3 h-8 w-8 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                                    title="Dismiss"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="flex gap-4">
                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-orange-500/20">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest">Assistant</p>
                                        <p className="text-[14px] font-bold text-slate-900 leading-[1.3]">
                                            Hi! I'm PeerLend AI. <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600 font-black">How can I help you today?</span>
                                        </p>
                                    </div>
                                </div>
                                {/* Decorative "Golden Hour" element */}
                                <div className="absolute top-2 right-4 h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-orange-500 to-rose-600 shadow-2xl shadow-rose-500/40 flex items-center justify-center text-white self-end"
                    >
                        <MessageSquare className="h-7 w-7" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-black rounded-full flex items-center justify-center border-2 border-white"
                        >
                            <Sparkles className="h-2.5 w-2.5" />
                        </motion.div>
                    </motion.button>
                </div>
            )}
        </div>
    );
}
