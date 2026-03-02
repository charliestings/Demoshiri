"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
    Search,
    Briefcase,
    TrendingUp,
    Zap,
    ShieldCheck,
    Info,
    Filter,
    X,
    SlidersHorizontal
} from "lucide-react";
import { formatINR, formatCompactINR } from "@/lib/formatters";
import { InvestLoanModal } from "./InvestLoanModal";
import { LoanDetailsModal } from "./LoanDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";

interface LenderViewProps {
    loans: any[];
    userId: string;
    onInvested: () => void;
    kycStatus: string;
    onShowWallet?: () => void;
    onShowSuccess?: (amount: number, purpose: string) => void;
    isLoading?: boolean;
    hasPin?: boolean;
}

export function LenderView({ loans, userId, onInvested, kycStatus, onShowWallet, onShowSuccess, isLoading = false, hasPin = false }: LenderViewProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Advanced Filters
    const [minROI, setMinROI] = useState<number>(0);
    const [maxAmount, setMaxAmount] = useState<number>(1000000);
    const [maxTerm, setMaxTerm] = useState<number>(60);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredLoans = loans.filter(l => {
        const matchesSearch = l.purpose.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || l.status === statusFilter;
        const matchesROI = l.interest_rate >= minROI;
        const matchesAmount = l.amount <= maxAmount;
        const matchesTerm = l.duration_months <= maxTerm;

        return matchesSearch && matchesStatus && matchesROI && matchesAmount && matchesTerm;
    });

    const resetFilters = () => {
        setMinROI(0);
        setMaxAmount(1000000);
        setMaxTerm(60);
        setSearch("");
        setStatusFilter("all");
    };

    const activeFiltersCount = (minROI > 0 ? 1 : 0) + (maxAmount < 1000000 ? 1 : 0) + (maxTerm < 60 ? 1 : 0);

    return (
        <div className="space-y-8 relative z-10">
            {/* Market Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Approved Opps", val: loans.length, icon: Briefcase, color: "rose" },
                    { label: "Avg. ROI", val: "10.4%", icon: TrendingUp, color: "orange" },
                    { label: "Active Capital", val: formatCompactINR(4200000), icon: Zap, color: "amber" },
                    { label: "Admin Verified", val: "100%", icon: ShieldCheck, color: "emerald" },
                ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 flex items-center gap-3 shadow-sm">
                        <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black text-slate-800">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Marketplace Advanced Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-300 transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-12 w-12 rounded-2xl border-slate-100 bg-white p-0 relative ${activeFiltersCount > 0 ? 'border-rose-200 bg-rose-50/30' : ''}`}
                            >
                                <SlidersHorizontal className={`h-5 w-5 ${activeFiltersCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-3xl !bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900">Marketplace Filters</DialogTitle>
                                <DialogDescription>Refine your search to find the best opportunities.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Min ROI (%)</Label>
                                        <span className="text-sm font-black text-rose-600">{minROI}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="30"
                                        step="1"
                                        value={minROI}
                                        onChange={(e) => setMinROI(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                        <span>0%</span>
                                        <span>15%</span>
                                        <span>30%</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Max Amount</Label>
                                        <span className="text-sm font-black text-slate-900">{formatCompactINR(maxAmount)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10000"
                                        max="5000000"
                                        step="10000"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                        <span>{formatCompactINR(10000)}</span>
                                        <span>{formatCompactINR(2500000)}</span>
                                        <span>{formatCompactINR(5000000)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Max Term (Months)</Label>
                                        <span className="text-sm font-black text-slate-900">{maxTerm} Mo</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        step="1"
                                        value={maxTerm}
                                        onChange={(e) => setMaxTerm(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                        <span>1 Mo</span>
                                        <span>30 Mo</span>
                                        <span>60 Mo</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={resetFilters}
                                    className="flex-1 rounded-xl font-bold border-slate-200 text-slate-500 hover:text-rose-600 transition-colors"
                                >
                                    Reset
                                </Button>
                                <Button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="flex-1 bg-slate-900 text-white rounded-xl font-bold shadow-lg"
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                    {["all", "approved", "funded"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? "bg-white text-rose-600 shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            {f === 'approved' ? 'Open' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Opportunities Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="glass-card border-slate-100 bg-white shadow-sm overflow-hidden">
                            <div className="h-1.5 w-full bg-slate-100" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <div className="flex justify-between items-end mb-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                    <div className="space-y-2 items-end flex flex-col">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-5 w-10" />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 flex-1 rounded-2xl" />
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No matching opportunities</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Try adjusting your filters or search terms to see more results.</p>
                    <Button
                        variant="link"
                        onClick={resetFilters}
                        className="text-rose-500 font-black uppercase tracking-widest text-[10px] mt-4"
                    >
                        Clear all filters
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredLoans.map((loan) => (
                        <Card key={loan.id} className="glass-card border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
                            <div className={`h-1.5 w-full bg-orange-500`} />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-1">{loan.purpose}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{loan.duration_months} Mo Term</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">{loan.interest_rate}% Interest</span>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-600`}>
                                        {loan.status}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Amount</p>
                                        <div className="text-3xl font-black text-slate-900">{formatINR(loan.amount)}</div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progress</p>
                                        <div className="text-sm font-black text-slate-700">{Math.round(((loan.funded_amount || 0) / loan.amount) * 100)}%</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((loan.funded_amount || 0) / loan.amount) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-orange-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <InvestLoanModal
                                            loan={loan}
                                            userId={userId}
                                            onInvested={onInvested}
                                            kycStatus={kycStatus}
                                            onShowWallet={onShowWallet}
                                            onShowSuccess={onShowSuccess}
                                            hasPin={hasPin}
                                        />
                                    </div>
                                    <LoanDetailsModal
                                        loan={loan}
                                        userId={userId}
                                        onInvested={onInvested}
                                        kycStatus={kycStatus}
                                        onShowWallet={onShowWallet}
                                        onShowSuccess={onShowSuccess}
                                        hasPin={hasPin}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
