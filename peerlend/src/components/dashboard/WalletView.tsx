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
import { AlertModal, AlertType } from "./AlertModal";

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
    const [totalInvested, setTotalInvested] = useState(0);
    const [totalBorrowed, setTotalBorrowed] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [alertConfig, setAlertConfig] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
    }>({
        open: false,
        title: "",
        message: "",
        type: "info"
    });

    const showAlert = (title: string, message: string, type: AlertType = "info", onConfirm?: () => void) => {
        setAlertConfig({ open: true, title, message, type, onConfirm });
    };

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

            // 1b. Fetch KYC Status - resilient fetch
            const { data: profile, error: profileErr } = await supabase
                .from("profiles")
                .select("kyc_status")
                .eq("id", userId)
                .single();
            if (profileErr) console.error("WalletView: KYC fetch error", profileErr);
            setKycStatus(profile?.kyc_status || 'not_started');
            console.log("WalletView: Data loaded", { balance: wallet?.balance, kycStatus: profile?.kyc_status });

            // 2. Fetch Transactions
            const { data: txns, error: txnsError } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", userId)
                .order("created_at", { ascending: false });

            if (txnsError) throw txnsError;
            setTransactions(txns || []);

            // 3. Fetch Total Invested
            const { data: investments, error: investError } = await supabase
                .from("investments")
                .select("amount")
                .eq("investor_id", userId);

            if (!investError && investments) {
                const total = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
                setTotalInvested(total);
            }

            // 4. Fetch Total Borrowed (from funded or repaid loans)
            const { data: borrowedLoans, error: borrowError } = await supabase
                .from("loans")
                .select("amount")
                .eq("borrower_id", userId)
                .in("status", ["funded", "repaid"]);

            if (!borrowError && borrowedLoans) {
                const total = borrowedLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
                setTotalBorrowed(total);
            }

            // 5. Fetch Total Earnings (interest from repayments)
            // Earnings are tracked in wallet_transactions as 'earning' type
            const { data: earnings, error: earnError } = await supabase
                .from("wallet_transactions")
                .select("amount")
                .eq("wallet_id", userId)
                .eq("type", "earning");

            if (!earnError && earnings) {
                // For 'earning' tx, the amount includes principal + interest. 
                // However, the RPC process_loan_repayment logs the FULL repayment (principal + interest) as 'earning'.
                // To get actual profit, we should look at the difference? 
                // Actually, let's keep it simple: sum of 'earning' amounts minus the principal of tied investments.
                // For now, we'll sum the profit portion if we can, or just sum 'earning' rows.
                // The current RPC adds 'earning' with the FULL (principal+interest) amount.
                // Let's calculate profit = sum(earning) - sum(original investments for those loans).

                let totalProfit = 0;
                // Query all investments that have been repaid to find cost basis
                const { data: repaidInv } = await supabase
                    .from("investments")
                    .select("amount, loans!inner(status)")
                    .eq("investor_id", userId)
                    .eq("loans.status", "repaid");

                const costBasis = repaidInv?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
                const totalReturns = earnings.reduce((sum, tn) => sum + (tn.amount || 0), 0);

                totalProfit = Math.max(0, totalReturns - costBasis);
                setTotalEarnings(totalProfit);
            }

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
            console.log("WalletView: Creating Cashfree order", { amount, userId });
            const orderResponse = await fetch('/api/cashfree/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, userId })
            });
            const orderData = await orderResponse.json();
            console.log("WalletView: Order data received", orderData);

            if (!orderResponse.ok || !orderData.payment_session_id) {
                throw new Error(orderData.error || "Failed to create order");
            }

            const { payment_session_id, order_id } = orderData;

            // 2. Load SDK
            console.log("WalletView: Loading Cashfree SDK");
            // @ts-ignore
            const { load } = await import('@cashfreepayments/cashfree-js');
            const cashfree = await load({ mode: 'sandbox' });
            console.log("WalletView: SDK Loaded, opening checkout");

            // 3. Open Checkout Modal
            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                redirectTarget: "_modal",
            };

            cashfree.checkout(checkoutOptions).then((result: any) => {
                if (result.error) {
                    console.log("Checkout closed or error:", result.error);
                    showAlert("Payment Failed", "Payment was cancelled or failed to process.", "error");
                    setDepositing(false);
                }
                if (result.paymentDetails) {
                    // 4. Verify Payment securely on the backend using user's auth JWT
                    supabase.auth.getSession().then(({ data: { session } }) => {
                        fetch('/api/cashfree/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session?.access_token}`
                            },
                            body: JSON.stringify({ order_id, user_id: userId })
                        })
                            .then(res => res.json())
                            .then(verifyData => {
                                if (verifyData.success) {
                                    setDepositAmount("");
                                    setShowDepositModal(false);
                                    fetchWalletData();
                                    showAlert("Deposit Success", "Funds have been added to your wallet successfully!", "success");
                                } else {
                                    showAlert("Verification Failed", verifyData.message || verifyData.error || "Payment verification failed.", "error");
                                }
                            })
                            .catch(verifyErr => {
                                console.error("Verification error:", verifyErr);
                                showAlert("Error", "There was an error verifying your payment. Please contact support.", "error");
                            })
                            .finally(() => {
                                setDepositing(false);
                            });
                    });
                }
            });

        } catch (error: any) {
            console.error("Deposit error:", error);
            if (error?.message?.includes('KYC')) {
                showAlert("KYC Required", "You must complete your KYC verification before adding funds to your wallet.", "warning");
            } else {
                showAlert("System Error", error?.message || "Failed to initiate deposit. Please try again.", "error");
            }
            setDepositing(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) return;

        if (balance !== null && amount > balance) {
            showAlert("Insufficient Balance", "You do not have enough funds in your wallet for this withdrawal.", "warning");
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
            showAlert("Withdrawal Failed", error.message || "We could not process your withdrawal request. Please try again.", "error");
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

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-6 md:mt-0">
                        <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-16 px-10 font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]">
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
                                <Button variant="outline" className="w-full sm:w-auto border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-16 px-8 font-black uppercase tracking-widest transition-all">
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
                    { label: "Total Invested", val: formatINR(totalInvested), icon: TrendingUp, color: "rose" },
                    { label: "Total Borrowed", val: formatINR(totalBorrowed), icon: ArrowDownCircle, color: "orange" },
                    { label: "Profit Earned", val: formatINR(totalEarnings), icon: DollarSign, color: "emerald" },
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


            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
}
