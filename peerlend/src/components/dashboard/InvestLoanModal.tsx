"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, DollarSign, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/formatters";
import { TransactionSuccessModal } from "./TransactionSuccessModal";

interface InvestLoanModalProps {
    loan: any;
    userId: string;
    onInvested: () => void;
    kycStatus?: string;
    onShowWallet?: () => void;
    onShowSuccess?: (amount: number, purpose: string) => void;
}

export function InvestLoanModal({
    loan,
    userId,
    onInvested,
    kycStatus,
    onShowWallet,
    onShowSuccess
}: InvestLoanModalProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleInvest = async (e: React.FormEvent) => {
        e.preventDefault();
        const investAmount = parseFloat(amount);

        if (isNaN(investAmount) || investAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        if (kycStatus !== 'approved') {
            alert("You must have an approved KYC status to invest.");
            return;
        }

        const remainingNeeded = loan.amount - (loan.funded_amount || 0);
        if (investAmount > remainingNeeded) {
            alert(`Amount exceeds remaining funds needed (${formatINR(remainingNeeded)})`);
            return;
        }

        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('process_loan_investment', {
                investor_uid: userId,
                target_loan_id: loan.id,
                invest_amount: investAmount
            });

            if (rpcError) {
                console.error("RPC Error Details:", JSON.stringify(rpcError, null, 2));
                throw new Error(rpcError.message || "Unknown RPC error");
            }

            if (data && data.success === false) {
                alert(data.error || "Failed to process investment");
                setLoading(false);
                return;
            }

            setOpen(false);
            onShowSuccess?.(investAmount, loan.purpose);
            setAmount("");
            onInvested();
            router.refresh();

        } catch (error: any) {
            console.error("Error investing:", error);
            alert("Failed to process investment: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black rounded-xl h-10 shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-transform">
                        Invest Now
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md !bg-white p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <div className="p-8 pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Support Opportunity</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Current Funding: {formatINR(loan.funded_amount || 0)} / {formatINR(loan.amount)}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {kycStatus !== 'approved' ? (
                        <div className="px-8 pb-10 text-center space-y-6">
                            <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 mx-auto border border-orange-100">
                                <DollarSign className="h-10 w-10" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Verification Required</h3>
                                <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                    You must have an approved KYC status to invest in loans.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="w-full rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[11px] py-7 hover:bg-slate-50 transition-all font-sans"
                            >
                                Got it, thanks
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleInvest} className="px-8 pb-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investment Amount (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Min ₹100"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                            className="w-full rounded-2xl border-slate-100 bg-slate-50 h-16 text-xl font-black focus:ring-4 focus:ring-rose-500/10 focus:border-rose-200 transition-all pl-6"
                                            max={loan.amount - (loan.funded_amount || 0)}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                                            Limit: {formatINR(loan.amount - (loan.funded_amount || 0))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] bg-gradient-to-r from-slate-900 to-black text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirm Investment"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl py-7 font-black uppercase tracking-widest transition-all font-sans"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

        </>
    );
}
