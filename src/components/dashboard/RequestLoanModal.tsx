"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Need to create or use standard input
import { Label } from "@/components/ui/label"; // Need to create or use standard label
import { supabase } from "@/lib/supabaseClient";
import { Plus, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export function RequestLoanModal({
    userId,
    onLoanCreated,
    kycStatus,
    trigger
}: {
    userId: string,
    onLoanCreated: () => void,
    kycStatus?: string,
    trigger?: React.ReactNode
}) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [term, setTerm] = useState("12");
    const [loading, setLoading] = useState(false);
    const [loanStats, setLoanStats] = useState({ active: 0, repaid: 0 });
    const [fetchingStats, setFetchingStats] = useState(true);
    const router = useRouter();

    const fetchLoanStats = async () => {
        try {
            const { data, error } = await supabase
                .from("loans")
                .select("status")
                .eq("borrower_id", userId);

            if (error) throw error;

            const active = data?.filter(l => ['pending', 'approved', 'funded'].includes(l.status)).length || 0;
            const repaid = data?.filter(l => l.status === 'repaid').length || 0;

            setLoanStats({ active, repaid });
        } catch (err) {
            console.error("Error fetching loan stats:", err);
        } finally {
            setFetchingStats(false);
        }
    };

    // Corrected to useEffect
    useEffect(() => {
        if (open) fetchLoanStats();
    }, [open, userId]);

    // Credit Ladder Logic
    const currentLimit = loanStats.repaid > 0 ? 3 : 1;
    const isAtLimit = loanStats.active >= currentLimit;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when form is submitted
        const { error } = await supabase
            .from("loans")
            .insert({
                borrower_id: userId,
                amount: parseFloat(amount),
                purpose,
                duration_months: parseInt(term),
                interest_rate: 10, // Fixed rate for MVP
                status: "pending",
                funded_amount: 0
            });

        setLoading(false);

        if (error) {
            console.error("Error creating loan:", error);
            alert(`Failed to create loan request: ${error.message || 'Unknown error'}`);
        } else {
            // Get admin users to notify them
            try {
                const { data: adminProfiles } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("is_admin", true);

                if (adminProfiles && adminProfiles.length > 0) {
                    const notifications = adminProfiles.map(admin => ({
                        user_id: admin.id,
                        title: "New Loan Request",
                        message: `A new loan request for ₹${amount} (${purpose}) has been submitted.`,
                        type: "loan_request",
                        link: "/dashboard?tab=admin"
                    }));

                    await supabase.from("notifications").insert(notifications);
                }
            } catch (notifyError) {
                console.error("Error creating admin notifications:", notifyError);
            }

            setOpen(false);
            setAmount("");
            setPurpose("");
            onLoanCreated();
            router.refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" /> Request Loan
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md !bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl !z-[100] !opacity-100">
                <div className="p-8 pb-4">
                    <DialogHeader className="!opacity-100">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight !opacity-100">Request a Loan</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium !opacity-100">
                            Fill in the details below to post your loan request to the marketplace.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {fetchingStats ? (
                    <div className="p-16 flex justify-center items-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    </div>
                ) : kycStatus !== 'approved' ? (
                    <div className="px-8 pb-10 text-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 mx-auto border border-orange-100">
                            <Plus className="h-10 w-10 rotate-45" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Verification Required</h3>
                            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                You must have an approved KYC status to request a loan.
                                {kycStatus === 'pending'
                                    ? " Your documents are currently under review by our safety team."
                                    : " Please visit your Profile Settings to complete your identity verification."}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="w-full rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[11px] py-7 hover:bg-slate-50 transition-all"
                        >
                            Got it, thanks
                        </Button>
                    </div>
                ) : isAtLimit ? (
                    <div className="px-8 pb-10 text-center space-y-6">
                        <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mx-auto border border-rose-100">
                            <ShieldAlert className="h-10 w-10" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Active Limit Reached</h3>
                            <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                {loanStats.repaid === 0
                                    ? "As a first-time borrower, you can only have 1 active loan at a time. Repay your current loan to unlock more borrowing power!"
                                    : `You have reached your limit of ${currentLimit} active loans. Repay one of your current loans to request another.`}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                <span>Borrowing Capacity</span>
                                <span className="text-rose-600">{loanStats.active} / {currentLimit}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full w-full transition-all duration-1000" />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="w-full rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[11px] py-7 hover:bg-slate-50 transition-all border-2"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
                        <div className="space-y-3">
                            <label htmlFor="amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Amount (₹)</label>
                            <input
                                id="amount"
                                type="number"
                                placeholder="e.g. 50,000"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="purpose" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Purpose</label>
                            <input
                                id="purpose"
                                placeholder="What will you use this for?"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="term" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Term</label>
                            <select
                                id="term"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all appearance-none cursor-pointer"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                            >
                                <option value="6">6 Months</option>
                                <option value="12">12 Months</option>
                                <option value="24">24 Months</option>
                                <option value="36">36 Months</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-slate-900 hover:bg-black text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Submit Request"}
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex-1 border-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl py-7 font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
