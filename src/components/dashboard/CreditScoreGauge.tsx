"use client";

import { motion } from "framer-motion";

interface CreditScoreGaugeProps {
    score: number;
    loading?: boolean;
}

export function CreditScoreGauge({ score, loading }: CreditScoreGaugeProps) {
    // 300 to 900 scale
    const minScore = 300;
    const maxScore = 900;
    const percentage = Math.min(Math.max((score - minScore) / (maxScore - minScore), 0), 1);

    // Color logic
    const getColor = (s: number) => {
        if (s >= 800) return "#10b981"; // Emerald-500
        if (s >= 700) return "#3b82f6"; // Blue-500
        if (s >= 600) return "#f59e0b"; // Amber-500
        return "#ef4444"; // Red-500
    };

    const color = getColor(score);
    const circumference = 100 * Math.PI; // Radius 50
    const strokeDashoffset = circumference - (percentage * circumference);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-bold animate-pulse">Contacting Bureau...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            {/* SVG Gauge */}
            <div className="relative w-64 h-32 overflow-hidden">
                <svg className="w-64 h-64 transform rotate-[180deg]" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset="0"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                    />
                </svg>
            </div>

            {/* Score Text */}
            <div className="absolute top-20 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-5xl font-black text-slate-900"
                    style={{ color }}
                >
                    {score}
                </motion.div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {score >= 800 ? "Excellent" : score >= 700 ? "Good" : score >= 600 ? "Average" : "Poor"}
                </div>
            </div>

            {/* Range Labels */}
            <div className="flex justify-between w-64 px-4 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>300</span>
                <span>900</span>
            </div>
        </div>
    );
}
