"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Plus,
    Loader2,
    TrendingUp,
    DollarSign,
    ShieldAlert,
    Landmark,
    Trash2,
    CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Transaction } from "@/types";
import { formatINR } from "@/lib/formatters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionSuccessModal } from "./TransactionSuccessModal";

interface WalletViewProps {
    userId: string;
}

export interface BankAccount {
    id: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    is_primary: boolean;
}

export function WalletView({ userId }: WalletViewProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositing, setDepositing] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [kycStatus, setKycStatus] = useState<string>('not_started');
    const [showDepositSuccess, setShowDepositSuccess] = useState(false);
    const [lastDepositAmount, setLastDepositAmount] = useState(0);

    // Bank Accounts State
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [addingBank, setAddingBank] = useState(false);
    const [newBank, setNewBank] = useState({
        account_holder_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: ""
    });

    // Withdrawal State
    const [selectedBankId, setSelectedBankId] = useState<string>("");

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

            // Removed Artificial Delay
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const fetchBankAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            const { data, error } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setBankAccounts(data || []);
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
        } finally {
            setLoadingAccounts(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchBankAccounts();
    }, [fetchBankAccounts]);

    // Restoration: Auto-verify on redirect
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const orderId = queryParams.get('order_id');

        if (orderId) {
            const verifyPayment = async () => {
                setLoading(true);
                try {
                    // Get the current session token for authenticated verification
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const response = await fetch('/api/cashfree/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ order_id: orderId, user_id: userId })
                    });
                    const result = await response.json();
                    if (result.success) {
                        setLastDepositAmount(result.amount || 0);
                        setShowDepositSuccess(true);
                        fetchWalletData();
                        // Clean up URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        console.warn("Verification result:", result);
                    }
                } catch (error) {
                    console.error("Verification error:", error);
                } finally {
                    setLoading(false);
                }
            };
            verifyPayment();
        }
    }, [fetchWalletData]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (isNaN(amount) || amount <= 0) return;

        setDepositing(true);
        try {
            // 1. Create Order via our API
            const response = await fetch('/api/cashfree/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, userId })
            });

            const data: { payment_session_id?: string; order_id?: string } = await response.json();
            const { payment_session_id } = data;

            if (!payment_session_id) throw new Error("Could not create payment session");

            // 2. Load SDK dynamically
            const { load } = await import('@cashfreepayments/cashfree-js');
            const cashfree = await load({ mode: 'sandbox' }); // Using sandbox as per implementation

            // 3. Open Checkout
            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                returnUrl: `${window.location.origin}/dashboard?tab=wallet&order_id=${data.order_id}`,
            };

            await cashfree.checkout(checkoutOptions);

        } catch (error: unknown) {
            console.error("Deposit error:", error);
            alert("Failed to initiate deposit: " + (error instanceof Error ? error.message : "Unknown error"));
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

        if (!selectedBankId) {
            alert("Please select a bank account for withdrawal");
            return;
        }

        setWithdrawing(true);
        try {
            const { error } = await supabase.rpc('process_wallet_transaction', {
                target_uid: userId,
                transaction_amount: amount,
                transaction_type: 'withdrawal',
                transaction_desc: 'Funds withdrawn to bank account'
            });

            if (error) throw error;

            setWithdrawAmount("");
            setSelectedBankId("");
            setShowWithdrawModal(false);
            fetchWalletData();
        } catch (error: unknown) {
            console.error("Withdrawal error:", error);
            alert("Failed to withdraw funds: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setWithdrawing(false);
        }
    };

    const handleAddBankAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingBank(true);
        try {
            const response = await fetch('/api/bank-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    account_holder_name: newBank.account_holder_name,
                    account_number: newBank.account_number,
                    ifsc_code: newBank.ifsc_code,
                    bank_name: newBank.bank_name,
                    is_primary: bankAccounts.length === 0 // Make primary if it's the first one
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Failed to add bank account");
            }

            setNewBank({ account_holder_name: "", account_number: "", ifsc_code: "", bank_name: "" });
            setShowAddBankModal(false);
            fetchBankAccounts();
        } catch (error: any) {
            console.error("Add Bank Error:", error);
            alert(error.message || "Unknown error occurred while adding bank account.");
        } finally {
            setAddingBank(false);
        }
    };

    const handleDeleteBankAccount = async (id: string) => {
        if (!confirm("Are you sure you want to remove this bank account?")) return;
        try {
            const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
            if (error) throw error;
            fetchBankAccounts();
        } catch (error) {
            console.error("Error deleting bank account:", error);
        }
    };

    // Removed unused getTransactionIcon

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
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Bank Account</label>
                                        {bankAccounts.length > 0 ? (
                                            <div className="grid gap-2">
                                                {bankAccounts.map(bank => (
                                                    <div
                                                        key={bank.id}
                                                        onClick={() => setSelectedBankId(bank.id)}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedBankId === bank.id
                                                            ? 'border-orange-500 bg-orange-50/50'
                                                            : 'border-slate-100 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedBankId === bank.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                <Landmark className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900">{bank.bank_name}</h4>
                                                                <p className="text-xs text-slate-500">****{bank.account_number.slice(-4)}</p>
                                                            </div>
                                                        </div>
                                                        {selectedBankId === bank.id && <CheckCircle2 className="h-5 w-5 text-orange-500" />}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                                                <p className="text-xs text-slate-500 mb-2">No bank accounts linked.</p>
                                                <Button type="button" variant="outline" size="sm" onClick={() => { setShowWithdrawModal(false); setShowAddBankModal(true); }} className="h-8 text-xs font-bold rounded-xl">
                                                    Add Bank Account
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={withdrawing || bankAccounts.length === 0 || !selectedBankId}
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

            {/* Bank Accounts Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Linked Bank Accounts</h3>
                    <Dialog open={showAddBankModal} onOpenChange={setShowAddBankModal}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl font-bold text-xs h-9 border-slate-200">
                                <Plus className="h-4 w-4 mr-1" /> Add Bank
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md !bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
                            <div className="p-8 pb-4">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add Bank Account</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-medium">
                                        Link your bank account for secure withdrawals.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                            <form onSubmit={handleAddBankAccount} className="p-8 pt-4 space-y-4">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Holder Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            className="rounded-xl border-slate-200 bg-white h-12 focus:ring-2 focus:ring-slate-900"
                                            value={newBank.account_holder_name}
                                            onChange={(e) => setNewBank({ ...newBank, account_holder_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                                        <Input
                                            placeholder="e.g. HDFC Bank, SBI"
                                            className="rounded-xl border-slate-200 bg-white h-12 focus:ring-2 focus:ring-slate-900"
                                            value={newBank.bank_name}
                                            onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
                                            <Input
                                                placeholder="0000 0000 0000"
                                                className="rounded-xl border-slate-200 bg-white h-12 focus:ring-2 focus:ring-slate-900"
                                                value={newBank.account_number}
                                                onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</label>
                                            <Input
                                                placeholder="SBIN0001234"
                                                className="rounded-xl border-slate-200 bg-white h-12 focus:ring-2 focus:ring-slate-900 uppercase"
                                                value={newBank.ifsc_code}
                                                onChange={(e) => setNewBank({ ...newBank, ifsc_code: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={addingBank}
                                    className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-xl font-bold mt-4"
                                >
                                    {addingBank ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Link Bank Account"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loadingAccounts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                ) : bankAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bankAccounts.map((bank) => (
                            <Card key={bank.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden group">
                                <CardContent className="p-5 flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            <Landmark className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{bank.bank_name}</h4>
                                            <p className="text-xs text-slate-500 font-medium tracking-widest">**** **** {bank.account_number.slice(-4)}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{bank.ifsc_code}</span>
                                                {bank.is_primary && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">Primary</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleDeleteBankAccount(bank.id)}
                                        title="Remove Account"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="p-8 text-center flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1">No Bank Accounts Linked</h4>
                            <p className="text-sm text-slate-500 max-w-sm">Link a bank account securely to withdraw your funds when needed.</p>
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            {/* Quick Actions / Stats removed as per user request */}



            <TransactionSuccessModal
                isOpen={showDepositSuccess}
                onClose={() => setShowDepositSuccess(false)}
                title="Wallet Funded!"
                amount={lastDepositAmount}
                description={`₹${lastDepositAmount.toLocaleString('en-IN')} has been added to your wallet successfully.`}
                onViewWallet={() => setShowDepositSuccess(false)}
            />
        </div>
    );
}
