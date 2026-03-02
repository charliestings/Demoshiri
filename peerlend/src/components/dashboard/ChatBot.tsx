"use client";

import { useState, useEffect, useRef } from "react";
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
    Info
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
    const [isOpen, setIsOpen] = useState(false);
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
        }
    }, [messages, isOpen]);

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

            if (data.error) throw new Error(data.error);

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm having trouble connecting right now. Please check your Gemini API key in the environment variables or try again later!",
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
        <div className="fixed bottom-6 right-6 z-[100] font-inter">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
                        className="mb-4 w-[380px] h-[550px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Chat Header */}
                        <div className="p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tighter text-sm">PeerLend AI</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-white/80 uppercase">Always Active</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                            >
                                <ChevronDown className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4 bg-slate-50/30">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm",
                                        msg.role === "user" ? "bg-slate-800" : "bg-gradient-to-br from-orange-400 to-rose-500"
                                    )}>
                                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[75%] p-4 rounded-[1.5rem] text-[13px] leading-relaxed font-medium shadow-sm border",
                                        msg.role === "user"
                                            ? "bg-slate-900 text-white border-slate-800 rounded-tr-none"
                                            : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white">
                                        <Sparkles className="h-4 w-4 animate-spin" />
                                    </div>
                                    <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm flex gap-1 items-center">
                                        <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" />
                                        <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Fixed Suggestions (Scrollable Horizontal) */}
                        <div className="px-6 py-3 border-t border-slate-100 bg-white/50 backdrop-blur-md">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(s.label)}
                                        className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 hover:border-orange-300 hover:text-orange-500 transition-all hover:shadow-sm"
                                    >
                                        <s.icon className="h-3 w-3" />
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-6 pt-0 bg-white/50 backdrop-blur-md">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="w-full bg-slate-100 border-0 focus:ring-2 focus:ring-orange-500/20 rounded-2xl px-5 py-3.5 pr-14 text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white disabled:opacity-50 disabled:grayscale shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative transition-all duration-500",
                    isOpen
                        ? "bg-slate-900 rotate-90"
                        : "bg-gradient-to-br from-orange-500 to-rose-600 shadow-rose-500/40"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-7 w-7" />}

                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-black rounded-full flex items-center justify-center border-2 border-white"
                    >
                        <Sparkles className="h-2.5 w-2.5" />
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
