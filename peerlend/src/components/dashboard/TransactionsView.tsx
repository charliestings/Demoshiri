"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
    History,
    Plus,
    Loader2,
    TrendingUp,
    DollarSign,
    ArrowRightLeft,
    CheckCircle2,
    ArrowDownCircle,
    Clock,
    Search,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsViewProps {
    userId: string;
}

export function TransactionsView({ userId }: TransactionsViewProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
            // Add Artificial Delay so user can see Skeletons!
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <Plus className="h-4 w-4 text-emerald-500" />;
            case 'withdrawal': return <ArrowDownCircle className="h-4 w-4 text-rose-500" />;
            case 'investment': return <TrendingUp className="h-4 w-4 text-orange-500" />;
            case 'loan_disbursement': return <DollarSign className="h-4 w-4 text-blue-500" />;
            case 'repayment': return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
            default: return <ArrowRightLeft className="h-4 w-4 text-slate-400" />;
        }
    };

    const filterOptions = [
        { id: 'all', label: 'All', icon: History },
        { id: 'deposit', label: 'Deposits', icon: Plus },
        { id: 'withdrawal', label: 'Withdrawals', icon: ArrowDownCircle },
        { id: 'investment', label: 'Investments', icon: TrendingUp },
        { id: 'repayment', label: 'Repayments', icon: CheckCircle2 },
        { id: 'loan_disbursement', label: 'Disbursements', icon: DollarSign },
    ];

    const filteredTransactions = transactions.filter(txn => {
        const matchesSearch = (txn.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            txn.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "all" || txn.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                <div className="flex flex-col gap-6">
                    <Skeleton className="h-16 w-full rounded-[1.25rem]" />
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden p-6">
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-6">
                                        <Skeleton className="h-16 w-16 rounded-[1.25rem]" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 items-end flex flex-col">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-all duration-300" />
                        <Input
                            placeholder="Search by description or type..."
                            className="pl-14 h-16 rounded-[1.25rem] border-slate-100 bg-white shadow-sm focus:ring-8 focus:ring-orange-500/5 focus:border-orange-200 transition-all text-base font-medium placeholder:text-slate-300 italic"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant={showFilters ? "default" : "outline"}
                            className={`h-16 px-8 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-300 ${showFilters
                                ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                                }`}
                        >
                            <Filter className={`mr-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            {showFilters ? 'Hide Filters' : 'Filter Activity'}
                        </Button>
                    </div>
                </div>

                {/* Animated Filter Bar */}
                <motion.div
                    initial={false}
                    animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-wrap gap-3 pb-2">
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setActiveFilter(option.id)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === option.id
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.05]"
                                    : "bg-white text-slate-400 border border-slate-100 hover:border-orange-200 hover:text-orange-500"
                                    }`}
                            >
                                <option.icon className="h-3.5 w-3.5" />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="divide-y divide-slate-100/50">
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-24 text-center"
                                >
                                    <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-pulse">
                                        <Clock className="h-12 w-12 text-slate-200" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No activity found</h3>
                                    <p className="text-slate-400 font-medium max-w-xs mx-auto">We couldn&apos;t find any transactions matching these criteria.</p>
                                    {(activeFilter !== 'all' || searchQuery) && (
                                        <Button
                                            variant="link"
                                            className="mt-6 text-orange-500 font-black uppercase tracking-widest text-xs"
                                            onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                                        >
                                            Clear all filters
                                        </Button>
                                    )}
                                </motion.div>
                            ) : (
                                filteredTransactions.map((txn) => (
                                    <motion.div
                                        key={txn.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-10 hover:bg-slate-50/80 transition-all duration-300 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={`h-16 w-16 rounded-[1.25rem] bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-orange-100 group-hover:shadow-orange-100/50 transition-all duration-500`}>
                                                {getTransactionIcon(txn.type)}
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 tracking-tight capitalize group-hover:text-orange-600 transition-colors">
                                                    {txn.description || txn.type.replace('_', ' ')}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="h-3 w-3" />
                                                        <p className="text-[11px] font-bold uppercase tracking-wider">
                                                            {new Date(txn.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60">{txn.type}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-3xl font-black tracking-tighter ${txn.amount > 0 ? 'text-emerald-600' : 'text-slate-900'} group-hover:scale-105 transition-transform duration-300`}>
                                                {txn.amount > 0 ? '+' : ''}{formatINR(txn.amount)}
                                            </p>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <div className={`h-2 w-2 rounded-full ${txn.amount > 0 ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse`} />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settled</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

