"use client";

import { useState } from "react";
import { Loan, Profile, ContactMessage } from "@/types";
import { formatINR } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Shield, CheckCircle2 } from "lucide-react";
import { BorrowerProfileModal } from "./BorrowerProfileModal";
import { KYCReviewModal } from "./KYCReviewModal";

export function AdminView({ loans, kycUsers, contactMessages, onUpdate, onKYCUpdate, onMessageRead }: {
    loans: Loan[],
    kycUsers: Profile[],
    contactMessages: ContactMessage[],
    onUpdate: (id: string, status: string) => void,
    onKYCUpdate: (id: string, status: 'approved' | 'rejected', reason?: string) => void,
    onMessageRead: (id: string) => void
}) {
    const [subTab, setSubTab] = useState<'loans' | 'kyc' | 'messages'>('loans');
    const pendingLoans = loans.filter(l => l.status === 'pending');
    const processedLoans = loans.filter(l => l.status !== 'pending');

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-100 w-fit">
                <button
                    onClick={() => setSubTab('loans')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'loans' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    Loans {pendingLoans.length > 0 && <span className="ml-1 text-rose-500">({pendingLoans.length})</span>}
                </button>
                <button
                    onClick={() => setSubTab('kyc')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'kyc' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    KYC {kycUsers.length > 0 && <span className="ml-1 text-orange-500">({kycUsers.length})</span>}
                </button>
                <button
                    onClick={() => setSubTab('messages')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'messages' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    Support {contactMessages.length > 0 && <span className="ml-1 text-pink-500">({contactMessages.length})</span>}
                </button>
            </div>

            {subTab === 'loans' ? (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            Pending Approvals
                            <span className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">{pendingLoans.length}</span>
                        </h2>

                        {pendingLoans.length === 0 ? (
                            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                                <CardContent className="py-12 text-center">
                                    <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All clear! No pending requests.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {pendingLoans.map((loan) => (
                                    <Card key={loan.id} className="glass-card bg-white overflow-hidden group hover:shadow-2xl transition-all border-slate-100">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                            <span className="font-black">{loan.profiles?.full_name?.charAt(0) || "U"}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-lg font-black text-slate-900 leading-tight">{loan.purpose}</h3>
                                                                {loan.profiles?.kyc_status === 'approved' && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100" title="Identity Verified">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        <span className="text-[8px] font-black uppercase">Verified</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-slate-500 font-medium">{loan.profiles?.email || "No email"}</p>
                                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                                <BorrowerProfileModal
                                                                    profile={loan.profiles as Profile}
                                                                    loan={loan}
                                                                    onApprove={() => onUpdate(loan.id, 'approved')}
                                                                    onReject={() => onUpdate(loan.id, 'rejected')}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-8">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                                            <p className="text-xl font-black text-slate-900">{formatINR(loan.amount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                                                            <p className="text-xl font-black text-rose-600">{loan.interest_rate}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Term</p>
                                                            <p className="text-xl font-black text-slate-900">{loan.duration_months} Mo</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-6 flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100">
                                                    <Button
                                                        onClick={() => onUpdate(loan.id, 'approved')}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => onUpdate(loan.id, 'rejected')}
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {processedLoans.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-700 mb-4 uppercase tracking-widest text-[10px]">Processing History</h2>
                            <div className="space-y-3">
                                {processedLoans.slice(0, 5).map((loan) => (
                                    <div key={loan.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-2 w-2 rounded-full ${loan.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="text-sm font-bold text-slate-800">{loan.purpose}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-black text-slate-900">{formatINR(loan.amount)}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : subTab === 'messages' ? (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        Unread Support Messages
                        <span className="text-sm font-black text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">{contactMessages.length}</span>
                    </h2>

                    {contactMessages.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                            <CardContent className="py-12 text-center">
                                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Inbox Zero! No unread messages.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {contactMessages.map((msg) => (
                                <Card key={msg.id} className="glass-card bg-white overflow-hidden group hover:shadow-2xl transition-all border-slate-100">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100">
                                                        <span className="font-black">{msg.name?.charAt(0) || "?"}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 leading-tight">{msg.name}</h3>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{msg.email}</p>
                                                    </div>
                                                    <div className="hidden md:block h-6 border-l border-slate-200 mx-2" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:inline-block">
                                                        {new Date(msg.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <h4 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">{msg.subject}</h4>
                                                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full md:w-auto flex justify-end shrink-0">
                                                <Button
                                                    onClick={() => onMessageRead(msg.id)}
                                                    className="bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl w-full md:w-auto h-12 transition-all shadow-sm"
                                                    title="Mark as Read"
                                                >
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    <span className="ml-2 font-bold">Mark Read</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        Pending KYC Verifications
                        <span className="text-sm font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{kycUsers.length}</span>
                    </h2>

                    {kycUsers.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                            <CardContent className="py-12 text-center">
                                <Shield className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All clear! No pending KYC submissions.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {kycUsers.map((user) => (
                                <Card key={user.id} className="glass-card bg-white overflow-hidden group hover:shadow-2xl transition-all border-slate-100">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="flex-1 p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                        <span className="text-lg font-black">{user.full_name?.charAt(0) || "U"}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-900 leading-tight">{user.full_name}</h3>
                                                        <p className="text-xs text-slate-500 font-medium mt-1">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8 mt-6">
                                                    {[
                                                        { label: 'City', val: user.city || 'N/A' },
                                                        { label: 'PAN', val: user.pan_number || 'N/A' },
                                                        { label: 'AI Similarity', val: user.kyc_match_score ? `${user.kyc_match_score}%` : '0%' },
                                                        { label: 'Monthly Income', val: formatINR(user.monthly_income || 0) },
                                                    ].map((s, i) => (
                                                        <div key={i}>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                            <p className="text-sm font-black text-slate-700">{s.val}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-6 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 min-w-[200px]">
                                                <KYCReviewModal
                                                    user={user}
                                                    onApprove={() => onKYCUpdate(user.id, 'approved')}
                                                    onReject={(reason) => onKYCUpdate(user.id, 'rejected', reason)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
