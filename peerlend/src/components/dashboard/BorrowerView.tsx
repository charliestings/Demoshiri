"use client";

import { Loan, Profile } from "@/types";
import { formatINR } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, ShieldCheck, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { RequestLoanModal } from "./RequestLoanModal";

export function BorrowerView({ loans, userId, onLoanCreated, kycStatus, userProfile, onRepayClick }: {
    loans: Loan[],
    userId: string,
    onLoanCreated: () => void,
    kycStatus: string,
    onShowWallet?: () => void,
    userProfile?: Profile,
    onShowRepaySuccess?: (amt: number, purpose: string) => void,
    onRepayClick: (loan: Loan) => void
}) {
    const getCreditStatus = (score?: number, status?: string) => {
        if (score && score > 0) {
            if (score >= 90) return "Excellent";
            if (score >= 70) return "Good";
            if (score >= 50) return "Fair";
            return "Poor";
        }

        // Fallback to basic KYC status if AI score isn't available
        if (status === 'approved') return "Good";
        if (status === 'pending') return "Pending";
        return "N/A";
    };

    const lifetimeLoans = loans.filter(l => ['funded', 'repaid'].includes(l.status));
    const totalBorrowed = lifetimeLoans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const pendingLoansCount = loans.filter(l => l.status === 'pending').length;
    const approvedLoansCount = loans.filter(l => l.status === 'approved').length;

    return (
        <div className="space-y-8 relative z-10">
            {/* Borrow Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <Card className="glass-card bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-orange-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Borrowed</p>
                                <h3 className="text-2xl font-black text-slate-900">{formatINR(totalBorrowed)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-rose-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Requests</p>
                                <h3 className="text-2xl font-black text-slate-900">{pendingLoansCount + approvedLoansCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-amber-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Profile</p>
                                <h3 className="text-2xl font-black text-slate-900">{getCreditStatus(userProfile?.kyc_match_score || 0, kycStatus)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    My Financing Requests
                    <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{loans.length}</span>
                </h2>

                {loans.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-rose-200">
                        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wallet className="h-10 w-10 text-rose-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No active loans</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">Ready to grow? Request your first loan to get started today.</p>
                        <div className="mt-8">
                            <RequestLoanModal
                                userId={userId}
                                onLoanCreated={onLoanCreated}
                                kycStatus={kycStatus}
                                trigger={
                                    <Button className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 shadow-lg shadow-rose-500/20 text-white border-0">
                                        Apply Now
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {loans.map((loan) => {
                            const repaymentAmount = loan.amount + (loan.amount * (loan.interest_rate / 100));
                            return (
                                <Card key={loan.id} className="glass-card border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
                                    <div className={`h-1.5 w-full ${loan.status === 'funded' ? 'bg-emerald-500' :
                                        loan.status === 'pending' ? 'bg-slate-300' : 'bg-orange-500'}`} />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 mb-1">{loan.purpose}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{loan.duration_months} Mo</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">{loan.interest_rate}% APR</span>
                                                </div>
                                            </div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${loan.status === 'funded' ? 'bg-emerald-50 text-emerald-600' :
                                                loan.status === 'pending' ? 'bg-slate-50 text-slate-600' :
                                                    loan.status === 'approved' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-rose-50 text-rose-600'
                                                }`}>
                                                {loan.status === 'pending' ? 'Reviewing' : loan.status}
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
                                            {/* Progress Bar placeholder since Progress component is missing */}
                                            <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((loan.funded_amount || 0) / loan.amount) * 100}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-emerald-500 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {loan.status === 'funded' && (
                                            <div className="pt-4 border-t border-slate-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Repay</p>
                                                        <p className="text-lg font-black text-slate-900">{formatINR(repaymentAmount)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => onRepayClick(loan)}
                                                    className="w-full bg-slate-900 border-0 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10"
                                                >
                                                    Repay Loan Now
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
