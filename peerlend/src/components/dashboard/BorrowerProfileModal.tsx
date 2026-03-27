"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Loan } from "@/types";
import { formatINR } from "@/lib/formatters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BorrowerProfileModal({ profile, loan, onApprove, onReject }: { profile: Profile, loan: Loan, onApprove: () => void, onReject: () => void }) {
    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<{ totalRequests: number, totalBorrowed: number, successRate: number, memberSince: string } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && profile?.id) {
            const fetchBorrowerStats = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from("loans")
                    .select("amount, status")
                    .eq("borrower_id", profile.id);

                if (!error && data) {
                    const totalRequests = data.length;
                    const approvedLoans = data.filter(l => l.status === 'approved' || l.status === 'funded');
                    const totalBorrowed = approvedLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
                    const successRate = totalRequests > 0 ? (approvedLoans.length / totalRequests) * 100 : 0;

                    setStats({
                        totalRequests,
                        totalBorrowed,
                        successRate: Math.round(successRate),
                        memberSince: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'
                    });
                }
                setLoading(false);
            };
            fetchBorrowerStats();
        }
    }, [open, profile?.id, profile?.created_at]);

    const aiScore = profile?.kyc_match_score || 0;
    const isLivenessVerified = profile?.kyc_liveness_verified || false;
    const kycStatus = profile?.kyc_status || 'none';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl">
                    Analyze Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl !bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <div className="p-8 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Borrower Analysis</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Real-time AI verification for {profile?.full_name || 'User'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 shadow-sm">
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">AI Trust Score</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-slate-900">{(aiScore ?? 0)}%</p>
                                    <p className="text-[10px] font-bold text-slate-400">Match Accuracy</p>
                                </div>
                                <div className="w-full bg-orange-200/50 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${(aiScore ?? 0) >= 80 ? 'bg-emerald-500' : (aiScore ?? 0) >= 50 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${(aiScore ?? 0)}%` }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Success Rate</p>
                                    <p className="text-base font-black text-emerald-600">{loading ? '...' : `${stats?.successRate || 0}%`}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Total Loans</p>
                                    <p className="text-base font-black text-slate-900">{loading ? '...' : stats?.totalRequests || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Identity Status</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${kycStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    kycStatus === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {kycStatus === 'approved' ? 'Verified' : kycStatus === 'pending' ? 'Reviewing' : 'No KYC'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Liveness</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLivenessVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isLivenessVerified ? 'Passed' : 'Not Validated'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Borrowed</span>
                                <span className="text-xs font-black text-slate-900">{loading ? '...' : formatINR(stats?.totalBorrowed || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Member Since</span>
                                <span className="text-xs font-black text-slate-900">{loading ? '...' : stats?.memberSince || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="px-8 py-4 pb-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Loan Request Details</h4>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Principal Amount</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{formatINR(loan.amount)}</p>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="flex items-center gap-4 justify-end">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Rate</p>
                                        <p className="text-sm font-black text-rose-600">{loan.interest_rate}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Term</p>
                                        <p className="text-sm font-black text-slate-900">{loan.duration_months} Mo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <Button
                            onClick={() => { onApprove(); setOpen(false); }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                        >
                            Approve Loan
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { onReject(); setOpen(false); }}
                            className="flex-1 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl py-7 font-black uppercase tracking-widest transition-all"
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
