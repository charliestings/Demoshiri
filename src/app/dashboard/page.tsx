"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardToggle } from "@/components/dashboard/DashboardToggle";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";

export default function DashboardPage() {
    const [mode, setMode] = useState<"borrower" | "lender">("lender");

    return (
        <div className="min-h-screen pb-20 bg-slate-50/50">
            <Navbar />

            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Command Center</h1>
                    <DashboardToggle mode={mode} setMode={setMode} />
                </div>

                <OverviewStats mode={mode} />

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {mode === "borrower" ? "Your Active Loans" : "Investment Opportunities"}
                    </h2>
                    {mode === "borrower" ? (
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Request Loan
                        </Button>
                    ) : (
                        <Button variant="outline" className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl">
                            <Filter className="h-4 w-4" /> Filter Market
                        </Button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {mode === "borrower" ? <BorrowerView /> : <LenderView />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function BorrowerView() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <Card key={i} className="glass-card border-slate-100 bg-white">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Personal Loan #{1000 + i}</h3>
                            <p className="text-sm text-slate-500 font-medium">Due in 15 days</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-slate-800">$5,000</div>
                            <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full inline-block mt-1">Active</div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {/* Empty State possibility */}
        </div>
    );
}

function LenderView() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="glass-card hover:shadow-xl cursor-pointer group bg-white border-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-start text-base">
                            <span className="text-slate-900 font-bold text-lg">Home Renovation</span>
                            <span className="bg-green-100 text-green-700 font-bold text-xs px-2.5 py-1 rounded-full">A+</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <div className="text-3xl font-extrabold text-indigo-600">12%</div>
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Return</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-slate-900">$10k</div>
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Goal</div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Progress</span>
                                <span>75%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                            </div>
                        </div>

                        <Button className="w-full bg-slate-900 text-white hover:bg-primary shadow-md transition-all rounded-xl font-semibold">
                            Invest Now
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
