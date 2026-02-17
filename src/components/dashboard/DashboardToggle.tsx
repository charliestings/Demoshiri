"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardToggleProps {
    mode: "borrower" | "lender";
    setMode: (mode: "borrower" | "lender") => void;
}

export function DashboardToggle({ mode, setMode }: DashboardToggleProps) {
    return (
        <div className="relative flex p-1 glass rounded-xl w-fit mx-auto mb-8 bg-white/50 border-white/60">
            <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg z-0 pointer-events-none shadow-md"
                layoutId="toggle-pill"
                animate={{
                    left: mode === "borrower" ? "4px" : "calc(50%)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            <button
                onClick={() => setMode("borrower")}
                className={cn(
                    "relative z-10 px-8 py-2 text-sm font-bold transition-colors duration-200 w-32 text-center",
                    mode === "borrower" ? "text-white" : "text-slate-500 hover:text-slate-800"
                )}
            >
                Borrow
            </button>

            <button
                onClick={() => setMode("lender")}
                className={cn(
                    "relative z-10 px-8 py-2 text-sm font-bold transition-colors duration-200 w-32 text-center",
                    mode === "lender" ? "text-white" : "text-slate-500 hover:text-slate-800"
                )}
            >
                Invest
            </button>
        </div>
    );
}
