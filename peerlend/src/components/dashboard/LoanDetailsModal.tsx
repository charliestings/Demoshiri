"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Info,
    User,
    Calendar,
    TrendingUp,
    ShieldCheck,
    Clock,
    Target,
    Briefcase,
    CheckCircle2,
    Shield,
    Zap
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { motion } from "framer-motion";
import { InvestLoanModal } from "./InvestLoanModal";

interface LoanDetailsModalProps {
    loan: any;
    userId: string;
    onInvested: () => void;
    kycStatus: string;
    onShowWallet?: () => void;
    onShowSuccess?: (amount: number, purpose: string) => void;
    hasPin?: boolean;
}

export function LoanDetailsModal({
    loan,
    userId,
    onInvested,
    kycStatus,
    onShowWallet,
    onShowSuccess,
    hasPin
}: LoanDetailsModalProps) {
    const [open, setOpen] = useState(false);
    const progress = Math.round(((loan.funded_amount || 0) / loan.amount) * 100);
    const profile = loan.profiles;

    // Late fee calculation logic (consistent with BorrowerView)
    let lateFee = 0;
    let isLate = false;
    let daysLate = 0;

    if (loan.due_date && loan.status === 'funded') {
        const dueDate = new Date(loan.due_date);
        const now = new Date();
        if (now > dueDate) {
            isLate = true;
            daysLate = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            if (daysLate > 0) {
                const baseRepayment = loan.amount + (loan.amount * (loan.interest_rate / 100));
                lateFee = (baseRepayment * (loan.late_fee_rate || 5.0) / 100.0) * (daysLate / 30.0);
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl border-slate-100 h-10 w-10 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl !bg-white p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                {/* Visual Header */}
                <div className="h-4 bg-gradient-to-r from-orange-500 to-rose-600 w-full" />

                <div className="p-8 pb-0">
                    <DialogHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                                    {loan.purpose}
                                </DialogTitle>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isLate ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            loan.status === 'funded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                        {isLate ? 'OVERDUE' : loan.status === 'approved' ? 'Open for Funding' : loan.status}
                                    </span>
                                    <span className="text-slate-400 text-xs font-bold">
                                        ID: {loan.id.slice(0, 8)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                                <p className="text-2xl font-black text-slate-900">{formatINR(loan.amount)}</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    {/* Funding Progress Section */}
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-inner">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Funds Gathered</p>
                                <p className="text-2xl font-black text-emerald-600">{formatINR(loan.funded_amount || 0)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion</p>
                                <p className="text-2xl font-black text-slate-900">{progress}%</p>
                            </div>
                        </div>
                        <div className="relative h-3 bg-white border border-slate-200 rounded-full overflow-hidden shadow-sm">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute h-full inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            />
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                            {formatINR(loan.amount - (loan.funded_amount || 0))} Remaining
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Borrower Details */}
                        <div className="space-y-6">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
                                <User className="h-3 w-3 text-orange-500" /> Borrower Profile
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 border border-white shadow-sm">
                                        <User className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 leading-none">{profile?.full_name || "Private Borrower"}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">Verified Identity</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                                        <p className="text-xs font-black text-slate-800">{profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Score</p>
                                        <p className="text-xs font-black text-emerald-600">A+ High Trust</p>
                                    </div>
                                </div>
                                {profile?.kyc_match_score && (
                                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">AI Verified Identity</span>
                                        </div>
                                        <span className="text-sm font-black text-emerald-700">{profile.kyc_match_score}% Match</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Loan Terms */}
                        <div className="space-y-6">
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
                                <TrendingUp className="h-3 w-3 text-rose-500" /> Investment Terms
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 tracking-tight">Loan Duration</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{loan.duration_months} Months</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-orange-500" />
                                        <span className="text-xs font-bold text-slate-500 tracking-tight">Interest Rate</span>
                                    </div>
                                    <span className="text-sm font-black text-rose-600">{loan.interest_rate}% APR</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 tracking-tight">
                                            {loan.status === 'funded' ? 'Due Date' : 'Expected Maturity'}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-black ${isLate ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {loan.due_date ?
                                            new Date(loan.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) :
                                            new Date(new Date().setMonth(new Date().getMonth() + (loan.duration_months || 12))).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                                        }
                                    </span>
                                </div>
                                {isLate && (
                                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-3 w-3 text-rose-600" />
                                            <span className="text-[10px] font-black text-rose-900/60 uppercase tracking-widest">Overdue Penalty</span>
                                        </div>
                                        <p className="text-xl font-black text-rose-600">
                                            {formatINR(lateFee)} <span className="text-[10px] text-rose-400">Accrued ({daysLate} days late)</span>
                                        </p>
                                    </div>
                                )}
                                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-3 w-3 text-orange-600" />
                                        <span className="text-[10px] font-black text-orange-900/60 uppercase tracking-widest">Est. Return</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-900">
                                        {formatINR(loan.amount * (loan.interest_rate / 100))} <span className="text-[10px] text-slate-400">Profit</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <div className="flex-1">
                        <InvestLoanModal
                            loan={loan}
                            userId={userId}
                            onInvested={() => {
                                onInvested();
                                setOpen(false);
                            }}
                            kycStatus={kycStatus}
                            onShowWallet={onShowWallet}
                            onShowSuccess={onShowSuccess}
                            hasPin={hasPin}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="rounded-2xl border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px] px-8 h-12"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
