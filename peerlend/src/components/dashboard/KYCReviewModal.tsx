"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";
import { formatINR } from "@/lib/formatters";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Info, CheckCircle2 } from "lucide-react";

export function KYCReviewModal({ user, onApprove, onReject }: { user: Profile, onApprove: () => void, onReject: (reason: string) => void }) {
    const [open, setOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
    const [isFetchingUrls, setIsFetchingUrls] = useState(false);

    useEffect(() => {
        const docs = user.kyc_documents || {};
        if (open && Object.keys(docs).length > 0) {
            const fetchSignedUrls = async () => {
                setIsFetchingUrls(true);
                const urls: { [key: string]: string } = {};

                for (const [key, path] of Object.entries(docs)) {
                    if (typeof path !== 'string') continue;

                    // Backward compatibility: If it's already a full URL, use it
                    if (path.startsWith('http')) {
                        urls[key] = path;
                        continue;
                    }

                    // Supabase createSignedUrl needs the full path within the bucket
                    const { data } = await supabase.storage
                        .from('kyc-documents')
                        .createSignedUrl(path, 600); // 10 minutes expiry

                    if (data?.signedUrl) {
                        urls[key] = data.signedUrl;
                    }
                }

                setSignedUrls(urls);
                setIsFetchingUrls(false);
            };

            fetchSignedUrls();
        }
    }, [open, user.kyc_documents]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl">
                    Review Documents
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl !bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">KYC Verification: {user.full_name}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Submitted on {user.kyc_submitted_at ? new Date(user.kyc_submitted_at).toLocaleString() : 'N/A'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    {/* Identity Details Section */}
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner flex flex-wrap gap-8 items-center bg-gradient-to-br from-slate-50 to-white">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Card Number</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter font-mono">{user.pan_number || 'N/A'}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden md:block" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aadhar Number</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter font-mono">
                                {user.aadhar_number ? `${user.aadhar_number.slice(0, 4)} ${user.aadhar_number.slice(4, 8)} ${user.aadhar_number.slice(8, 12)}` : 'N/A'}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm transition-all hover:scale-[1.05]">
                                <Shield className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Anti-Scam Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { id: 'id_front', label: 'Gov ID Front', url: signedUrls.id_front },
                            { id: 'id_back', label: 'Gov ID Back', url: signedUrls.id_back },
                            { id: 'pan_card', label: 'PAN Card', url: signedUrls.pan_card },
                            { id: 'selfie', label: 'Selfie with ID', url: signedUrls.selfie },
                        ].map((doc) => (
                            <div key={doc.id} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{doc.label}</Label>
                                    {isFetchingUrls && <Loader2 className="h-3 w-3 animate-spin text-slate-300" />}
                                </div>
                                <div className="relative aspect-video rounded-3xl border border-slate-100 bg-slate-50 overflow-hidden group shadow-sm transition-all hover:shadow-md">
                                    {doc.url ? (
                                        <>
                                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-[8px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest pointer-events-none border border-white/10 shadow-lg" style={{ zIndex: 10 }}>
                                                Encrypted Access
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-[2px]"
                                                style={{ zIndex: 5 }}
                                            >
                                                Open High-Res
                                            </a>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                                            {isFetchingUrls ? (
                                                <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                                            ) : (
                                                <div className="p-4 rounded-full bg-slate-100/50">
                                                    <Info className="h-8 w-8 opacity-20" />
                                                </div>
                                            )}
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No Image Data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                            <Shield className="h-4 w-4 text-orange-500" /> AI Verification Engine Insights
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm transition-transform hover:scale-[1.02]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Biometric Match</p>
                                <div className="flex items-end gap-3">
                                    <span className={`text-4xl font-black tracking-tighter ${(user.kyc_match_score ?? 0) >= 80 ? 'text-emerald-600' : (user.kyc_match_score ?? 0) >= 50 ? 'text-orange-600' : 'text-rose-600'}`}>
                                        {user.kyc_match_score ?? 0}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Confidence</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${(user.kyc_match_score ?? 0) >= 80 ? 'bg-emerald-500' : (user.kyc_match_score ?? 0) >= 50 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${user.kyc_match_score ?? 0}%` }} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02]">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Liveness Proof</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xl font-black uppercase tracking-tight ${user.kyc_liveness_verified ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {user.kyc_liveness_verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </div>
                                </div>
                                {user.kyc_liveness_verified ? (
                                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-inner">
                                        <Info className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    {showRejectInput ? (
                        <div className="space-y-6 bg-rose-50/50 p-8 rounded-3xl border border-rose-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-rose-900/60">Reason for Rejection</Label>
                                <textarea
                                    className="w-full rounded-2xl border border-rose-200 bg-white p-4 text-sm focus:ring-4 focus:ring-rose-500/10 outline-none h-32 transition-all shadow-inner"
                                    placeholder="Explain why the documents were rejected (e.g. Blurry image, PAN name doesn't match...)"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => onReject(rejectionReason)}
                                    disabled={!rejectionReason}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest rounded-2xl py-7 shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
                                >
                                    Confirm Rejection
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectInput(false)}
                                    className="flex-1 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white rounded-2xl py-7 font-black uppercase tracking-widest border-2"
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-6">
                            <Button
                                onClick={() => { onApprove(); setOpen(false); }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                            >
                                Approve Verification
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectInput(true)}
                                className="flex-1 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl py-7 font-black uppercase tracking-widest transition-all"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
