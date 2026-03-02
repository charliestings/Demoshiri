"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, DollarSign, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/formatters";
import { PinVerificationModal } from "./PinVerificationModal";
import { AlertModal, AlertType } from "./AlertModal";

interface InvestLoanModalProps {
    loan: any;
    userId: string;
    onInvested: () => void;
    kycStatus?: string;
    onShowWallet?: () => void;
    onShowSuccess?: (amount: number, purpose: string) => void;
    hasPin?: boolean;
}

export function InvestLoanModal({
    loan,
    userId,
    onInvested,
    kycStatus,
    onShowWallet,
    onShowSuccess,
    hasPin
}: InvestLoanModalProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        open: boolean;
        title: string;
        message: string;
        type: AlertType;
    }>({
        open: false,
        title: "",
        message: "",
        type: "info"
    });
    const router = useRouter();

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertConfig({ open: true, title, message, type });
    };

    const handleInvestInitiate = (e: React.FormEvent) => {
        e.preventDefault();
        const investAmount = parseFloat(amount);

        if (isNaN(investAmount) || investAmount <= 0) {
            showAlert("Invalid Amount", "Please enter a valid amount to invest.", "warning");
            return;
        }

        if (kycStatus !== 'approved') {
            showAlert("KYC Required", "You must have an approved KYC status to invest in opportunities.", "warning");
            return;
        }

        const remainingNeeded = loan.amount - (loan.funded_amount || 0);
        if (investAmount > remainingNeeded) {
            showAlert("Limit Exceeded", `The investment amount exceeds the remaining funds needed (${formatINR(remainingNeeded)}).`, "warning");
            return;
        }

        console.log("InvestModal: Initiating investment", { amount, hasPin });

        if (!hasPin) {
            showAlert("PIN Missing", "Please set your 6-digit Transaction PIN in Settings before investing.", "warning");
            onShowSuccess?.(0, "redirect_settings"); // Optional: handle redirect in parent
            return;
        }

        // 1. Close Amount Modal first
        setOpen(false);
        console.log("InvestModal: Closing amount dialog");

        // 2. Open PIN Modal after a small delay
        setTimeout(() => {
            console.log("InvestModal: Opening PIN verification modal");
            setIsPinModalOpen(true);
        }, 500); // Increased delay for Edge/Radix stability
    };

    const handleActualInvest = async () => {
        const investAmount = parseFloat(amount);
        console.log("InvestModal: handleActualInvest called", { amount, investAmount });

        if (isNaN(investAmount) || investAmount <= 0) {
            console.error("InvestModal: Invalid amount detected during transaction", { amount });
            showAlert("Investment Error", "Investment amount is missing or invalid. Please try again.", "error");
            setIsPinModalOpen(false);
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
                showAlert("Investment Failed", data.error || "We could not process your investment. Please try again later.", "error");
                return;
            }

            console.log("InvestModal: Success!", { investAmount });
            onShowSuccess?.(investAmount, loan.purpose);
            setAmount("");
            setIsPinModalOpen(false);
            onInvested();
            router.refresh();

        } catch (error: any) {
            console.error("Error investing:", error);
            showAlert("System Error", "Failed to process investment: " + (error.message || "Unknown error"), "error");
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
                        <form onSubmit={handleInvestInitiate} className="px-8 pb-10 space-y-6">
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

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:flex-[2] bg-gradient-to-r from-slate-900 to-black text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Confirm Investment"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="w-full sm:flex-1 border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl py-7 font-black uppercase tracking-widest transition-all font-sans"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <PinVerificationModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handleActualInvest}
                title="Authorize Investment"
                description={`Enter your 6-digit transaction PIN to confirm your investment of ${formatINR(parseFloat(amount) || 0)} in "${loan.purpose}".`}
            />

            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </>
    );
}
