"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, CheckCircle2, AlertCircle, Clock, Upload, FileUp } from "lucide-react";
import { motion } from "framer-motion";
import { KYCCameraCapture } from "./KYCCameraCapture";
import { compressImage } from "@/lib/imageUtils";
import { AlertModal, AlertType } from "./AlertModal";

interface KYCViewProps {
    user: SupabaseUser;
    onUpdate?: () => void;
}

export function KYCView({ user, onUpdate }: KYCViewProps) {
    const [kycUploading, setKycUploading] = useState(false);
    const [kycFiles, setKycFiles] = useState<{ [key: string]: File | null }>({
        id_front: null,
        id_back: null,
        pan_card: null,
        selfie: null
    });

    const [alertConfig, setAlertConfig] = useState({
        open: false,
        title: "",
        message: "",
        type: "info" as AlertType,
        onConfirm: undefined as (() => void) | undefined
    });

    const showAlert = (title: string, message: string, type: AlertType = "info", onConfirm?: () => void) => {
        setAlertConfig({ open: true, title, message, type, onConfirm });
    };

    const [formData, setFormData] = useState({
        kyc_status: "not_started",
        kyc_documents: {} as Record<string, string>,
        kyc_rejection_reason: "",
        kyc_submitted_at: "",
        kyc_match_score: 0,
        kyc_liveness_verified: false,
        document_hashes: {} as Record<string, string>
    });

    // Fetch initial profile data (only KYC part)
    useEffect(() => {
        const fetchKYCStatus = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from("profiles")
                .select("kyc_status, kyc_documents, kyc_rejection_reason, kyc_submitted_at, kyc_match_score, kyc_liveness_verified, document_hashes")
                .eq("id", user.id)
                .single();

            if (data) {
                setFormData({
                    kyc_status: data.kyc_status || "not_started",
                    kyc_documents: data.kyc_documents || {},
                    kyc_rejection_reason: data.kyc_rejection_reason || "",
                    kyc_submitted_at: data.kyc_submitted_at || "",
                    kyc_match_score: data.kyc_match_score || 0,
                    kyc_liveness_verified: data.kyc_liveness_verified || false,
                    document_hashes: data.document_hashes || {}
                });
            }
        };
        fetchKYCStatus();
    }, [user]);

    const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (kycFiles.id_front) {
            const url = URL.createObjectURL(kycFiles.id_front);
            setIdCardPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setIdCardPreviewUrl(null);
        }
    }, [kycFiles.id_front]);

    const [capturedSelfie, setCapturedSelfie] = useState<{ src: string, score: number, live: boolean, notes?: string } | null>(null);

    const handleSelfieCapture = useCallback((src: string, score: number, live: boolean, notes?: string) => {
        setCapturedSelfie({ src, score, live, notes });
    }, []);

    const handleKYCFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files && e.target.files[0]) {
            setKycFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const calculateHash = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSubmitKYC = async () => {
        if (!kycFiles.id_front || !kycFiles.id_back || !kycFiles.pan_card || (!kycFiles.selfie && !capturedSelfie)) {
            showAlert("Missing Documents", "Please upload/capture all 4 documents to submit for verification.", "warning");
            return;
        }

        setKycUploading(true);
        try {
            const documentUrls: { [key: string]: string } = {};
            const currentHashes: { [key: string]: string } = {};

            const dataURLtoFile = (dataurl: string, filename: string) => {
                const arr = dataurl.split(',');
                const mimeMatch = arr[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, { type: mime });
            };

            const filesToUpload: { [key: string]: File } = {};

            for (const [key, file] of Object.entries(kycFiles)) {
                if (file) {
                    const compressed = await compressImage(file) as File;
                    filesToUpload[key] = compressed;
                }
            }

            if (capturedSelfie && !kycFiles.selfie) {
                const selfieFile = dataURLtoFile(capturedSelfie.src, 'selfie-captured.jpg');
                const compressedSelfie = await compressImage(selfieFile) as File;
                filesToUpload.selfie = compressedSelfie;
                currentHashes.selfie = await calculateHash(selfieFile);
            } else if (kycFiles.selfie) {
                currentHashes.selfie = await calculateHash(kycFiles.selfie);
            }

            if (kycFiles.id_front) currentHashes.id_front = await calculateHash(kycFiles.id_front);
            if (kycFiles.id_back) currentHashes.id_back = await calculateHash(kycFiles.id_back);
            if (kycFiles.pan_card) currentHashes.pan_card = await calculateHash(kycFiles.pan_card);

            for (const [key, hash] of Object.entries(currentHashes)) {
                const { data: duplicateUser } = await supabase
                    .from("profiles")
                    .select("id")
                    .neq("id", user.id)
                    .contains('document_hashes', { [key]: hash })
                    .maybeSingle();

                if (duplicateUser) {
                    showAlert("Security Alert", `The document for ${key.replace('_', ' ')} has already been used by another account.`, "error");
                    setKycUploading(false);
                    return;
                }
            }

            for (const [key, file] of Object.entries(filesToUpload)) {
                if (!file) continue;
                const fileExt = file.name.split('.').pop();
                const filePath = `${user.id}/${key}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('kyc-documents')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true });

                if (uploadError) throw uploadError;
                documentUrls[key] = filePath;
            }

            if (capturedSelfie?.notes) {
                documentUrls.ai_notes = capturedSelfie.notes;
            }

            const { error: dbError } = await supabase
                .from("profiles")
                .update({
                    kyc_status: 'pending',
                    kyc_documents: documentUrls,
                    document_hashes: currentHashes,
                    kyc_submitted_at: new Date().toISOString(),
                    kyc_rejection_reason: "",
                    kyc_match_score: capturedSelfie?.score || 0,
                    kyc_liveness_verified: capturedSelfie?.live || false
                })
                .eq("id", user.id);

            if (dbError) throw dbError;

            setFormData(prev => ({
                ...prev,
                kyc_status: 'pending',
                kyc_documents: documentUrls,
                document_hashes: currentHashes,
                kyc_submitted_at: new Date().toISOString(),
                kyc_match_score: capturedSelfie?.score || 0,
                kyc_liveness_verified: capturedSelfie?.live || false
            }));

            if (onUpdate) onUpdate();
            showAlert("Verification Submitted", `KYC submitted! AI Match Score: ${capturedSelfie?.score ?? 'Manual Verify'}%`, "success");
        } catch (error: any) {
            console.error("KYC submission error:", error);
            showAlert("Submission Failed", `Failed to submit KYC: ${error.message}`, "error");
        } finally {
            setKycUploading(false);
        }
    };

    const handleResetKYC = async () => {
        showAlert(
            "Reset KYC",
            "Are you sure you want to reset your KYC? You will need to re-upload all documents.",
            "confirm",
            async () => {
                try {
                    const { error: resetErr } = await supabase
                        .from("profiles")
                        .update({
                            kyc_status: 'none',
                            kyc_rejection_reason: "",
                            kyc_match_score: 0,
                            kyc_liveness_verified: false
                        })
                        .eq("id", user.id);

                    if (resetErr) throw resetErr;

                    setFormData(prev => ({ ...prev, kyc_status: 'none', kyc_rejection_reason: "" }));
                    setKycFiles({ id_front: null, id_back: null, pan_card: null, selfie: null });
                    setCapturedSelfie(null);
                    setIdCardPreviewUrl(null);

                    if (onUpdate) onUpdate();
                    showAlert("Reset Complete", "KYC reset successfully.", "success");
                } catch (err: any) {
                    console.error("KYC reset error:", err);
                    showAlert("Reset Failed", `Failed to reset KYC: ${err.message}`, "error");
                }
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Identity Verification</h2>
                <p className="text-slate-500 font-medium">Verify your identity to increase your transacting limits and trust score.</p>
            </div>

            <Card className="border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg font-bold text-slate-900">Verification Status</CardTitle>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                    formData.kyc_status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                    formData.kyc_status === 'pending' ? 'bg-orange-50 text-orange-600' :
                                    formData.kyc_status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                    'bg-slate-50 text-slate-400'
                                }`}>
                                    {formData.kyc_status.replace('_', ' ')}
                                </span>
                            </div>
                            <CardDescription>Securely verify your identity using AI.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {formData.kyc_status === 'approved' ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Verification Complete</h3>
                            <p className="text-slate-500 max-w-sm">Your identity has been verified. You have full access to platform features.</p>
                            <Button variant="ghost" onClick={handleResetKYC} className="mt-6 text-slate-400 font-bold text-[10px] uppercase">Re-verify</Button>
                        </div>
                    ) : formData.kyc_status === 'pending' ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                <Clock className="h-10 w-10 text-orange-500 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Review in Progress</h3>
                            <p className="text-slate-500 max-w-sm">We are reviewing your docs. Usually takes 24-48 hours.</p>
                            <Button variant="ghost" onClick={handleResetKYC} className="mt-6 text-slate-400 font-bold text-[10px] uppercase">Cancel & Re-upload</Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {formData.kyc_status === 'rejected' && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-rose-500" />
                                    <div>
                                        <p className="text-sm font-black text-rose-900">Verification Rejected</p>
                                        <p className="text-xs font-medium text-rose-700/80 mt-1">{formData.kyc_rejection_reason}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { id: 'id_front', label: 'Gov ID Front', desc: 'Aadhaar / Voter ID (Front)' },
                                    { id: 'id_back', label: 'Gov ID Back', desc: 'Aadhaar / Voter ID (Back)' },
                                    { id: 'pan_card', label: 'PAN Card', desc: 'Front view of PAN Card' },
                                    { id: 'selfie', label: 'Selfie Verification', desc: 'Capture live selfie' },
                                ].map((doc) => (
                                    <div key={doc.id} className={`space-y-4 ${doc.id === 'selfie' ? 'md:col-span-2' : ''}`}>
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-900">{doc.label}</Label>
                                            {(kycFiles[doc.id] || (doc.id === 'selfie' && capturedSelfie)) && (
                                                <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</span>
                                            )}
                                        </div>

                                        {doc.id === 'selfie' ? (
                                            <div className="bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-inner">
                                                <KYCCameraCapture onCapture={handleSelfieCapture} idCardImage={idCardPreviewUrl} />
                                                {capturedSelfie && (
                                                    <div className={`mt-4 flex items-center justify-between p-3 rounded-xl border ${capturedSelfie.score > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold">AI Match Score: {capturedSelfie.score}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle2 className={`h-3 w-3 ${capturedSelfie.live ? 'text-emerald-600' : 'text-slate-300'}`} />
                                                            <span className="text-[10px] font-black uppercase">Live</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <input type="file" accept="image/*" onChange={(e) => handleKYCFileChange(e, doc.id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${kycFiles[doc.id] ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    {kycFiles[doc.id] ? <FileUp className="h-6 w-6 text-emerald-500" /> : <Upload className="h-6 w-6 text-slate-300" />}
                                                    <p className="text-[10px] font-bold text-slate-400 capitalize">{kycFiles[doc.id]?.name || 'Select Image'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button onClick={handleSubmitKYC} disabled={kycUploading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-14 uppercase tracking-widest">
                                {kycUploading ? "Uploading Assets..." : "Submit for Verification"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

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
