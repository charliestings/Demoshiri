"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    History,
    Plus,
    Loader2,
    TrendingUp,
    DollarSign,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/formatters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletViewProps {
    userId: string;
}

export function WalletView({ userId }: WalletViewProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositing, setDepositing] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [kycStatus, setKycStatus] = useState<string>('not_started');

    const fetchWalletData = useCallback(async () => {
        try {
            // 1. Fetch Balance
            const { data: wallet, error: walletError } = await supabase
                .from("wallets")
                .select("balance")
                .eq("id", userId)
                .single();

            if (walletError && walletError.code !== 'PGRST116') throw walletError;
            setBalance(wallet?.balance || 0);

            // 1b. Fetch KYC Status
            const { data: profile } = await supabase
                .from("profiles")
                .select("kyc_status")
                .eq("id", userId)
                .single();
            setKycStatus(profile?.kyc_status || 'not_started');

            // 2. Fetch Transactions
            const { data: txns, error: txnsError } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", userId)
                .order("created_at", { ascending: false });

            if (txnsError) throw txnsError;
            setTransactions(txns || []);

            // Add Artificial Delay so user can see Skeletons!
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) return;

        setDepositing(true);
        try {
            const { data, error } = await supabase.rpc('deposit_funds', {
                amount_to_add: amount
            });

            if (error) throw error;

            setDepositAmount("");
            setShowDepositModal(false);
            fetchWalletData();
        } catch (error: any) {
            console.error("Deposit error:", error);

            // Check if it's the specific KYC error we added to Supabase
            if (error?.message?.includes('KYC verification')) {
                alert("You must complete your KYC verification before you can add funds to your wallet.");
            } else {
                alert("Failed to deposit funds: " + (error?.message || "Please make sure your KYC is approved."));
            }
        } finally {
            setDepositing(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) return;

        if (balance !== null && amount > balance) {
            alert("Insufficient balance");
            return;
        }

        setWithdrawing(true);
        try {
            const { data, error } = await supabase.rpc('process_wallet_transaction', {
                target_uid: userId,
                transaction_amount: amount,
                transaction_type: 'withdrawal',
                transaction_desc: 'Funds withdrawn from wallet'
            });

            if (error) throw error;

            setWithdrawAmount("");
            setShowWithdrawModal(false);
            fetchWalletData();
        } catch (error: any) {
            console.error("Withdrawal error:", error);
            alert("Failed to withdraw funds: " + (error.message || "Unknown error"));
        } finally {
            setWithdrawing(false);
        }
    };

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

    if (loading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                <Skeleton className="h-64 w-full rounded-[2.5rem] bg-slate-900" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <Skeleton className="h-32 w-full rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Wallet Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-10 text-white shadow-2xl shadow-slate-900/40"
            >
                {/* Decorative background elements */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-rose-500/10 blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Wallet className="h-5 w-5 text-orange-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total Balance</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <h2 className="text-6xl font-black tracking-tighter">
                                {balance !== null ? formatINR(balance) : "₹0.00"}
                            </h2>
                            <span className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                Active
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Your protected capital on PeerLend.</p>
                    </div>

                    <div className="flex gap-4">
                        <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
                            <DialogTrigger asChild>
                                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-16 px-10 font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]">
                                    <Plus className="mr-2 h-5 w-5" /> Add Funds
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md !bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
                                <div className="p-8 pb-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Deposit Funds</DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Transfer money to your PeerLend wallet instantly.
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>
                                {kycStatus === 'approved' ? (
                                    <form onSubmit={handleDeposit} className="p-8 pt-4 space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 5,000"
                                                className="rounded-2xl border-slate-100 bg-slate-50 h-16 text-xl font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={depositing}
                                            className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                                        >
                                            {depositing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirm Deposit"}
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="p-8 pt-4 space-y-6 text-center">
                                        <div className="mx-auto w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Verification Required</h3>
                                        <p className="text-slate-500 text-sm">
                                            You must complete your KYC verification before you can add funds to your wallet.
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={() => window.location.href = '/settings'}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                                        >
                                            Verify Now
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-16 px-8 font-black uppercase tracking-widest transition-all">
                                    Withdraw
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md !bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
                                <div className="p-8 pb-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Transfer money from your PeerLend wallet to your bank account.
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>
                                <form onSubmit={handleWithdraw} className="p-8 pt-4 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="e.g. 2,000"
                                                className="rounded-2xl border-slate-100 bg-slate-50 h-16 text-xl font-black focus:ring-4 focus:ring-rose-500/10 focus:border-rose-200 transition-all"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                max={balance || 0}
                                                required
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Available: {balance ? formatINR(balance) : "₹0"}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={withdrawing}
                                        className="w-full bg-slate-900 hover:bg-black text-white h-16 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                                    >
                                        {withdrawing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirm Withdrawal"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Invested", val: "₹1,24,000", icon: TrendingUp, color: "rose" },
                    { label: "Total Borrowed", val: "₹0", icon: ArrowDownCircle, color: "orange" },
                    { label: "Platform Earnings", val: "₹12,400", icon: DollarSign, color: "emerald" },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className={`h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <ArrowUpCircle className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900">{stat.val}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>


        </div>
    );
}
