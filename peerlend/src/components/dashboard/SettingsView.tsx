"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Shield, User, Lock, Trash2, Mail, Save, FileUp, CheckCircle2, AlertCircle, Clock, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { CreditScoreGauge } from "./CreditScoreGauge";
import { KYCCameraCapture } from "./KYCCameraCapture";
import { compressImage } from "@/lib/imageUtils";
import { AlertModal, AlertType } from "./AlertModal";

interface SettingsViewProps {
    user: SupabaseUser;
    onUpdate?: () => void;
}

export function SettingsView({ user, onUpdate }: SettingsViewProps) {
    const [loading, setLoading] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [checkingScore, setCheckingScore] = useState(false);
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

    const [pinLoading, setPinLoading] = useState(false);
    const [pinData, setPinData] = useState({
        pin: "",
        confirmPin: "",
        hasPin: false
    });

    const [formData, setFormData] = useState({
        // Personal
        full_name: "",
        username: "",
        bio: "",
        gender: "",
        date_of_birth: "",
        profile_image: "",

        // Contact & Location
        phone: "",
        email: "", // Read-only from auth or profile
        address: "",
        city: "",
        state: "",
        pincode: "",

        // Financial & Professional
        occupation: "",
        monthly_income: "",
        pan_number: "",
        aadhar_number: "",

        // Preferences
        email_notifications: true,

        // KYC
        kyc_status: "not_started",
        kyc_documents: {} as Record<string, string>,
        kyc_rejection_reason: "",
        kyc_submitted_at: "",
        kyc_match_score: 0,
        kyc_liveness_verified: false,
        document_hashes: {} as Record<string, string>
    });

    // Fetch initial profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                setFormData({
                    full_name: data.full_name || user.user_metadata?.full_name || "",
                    username: data.username || user.email?.split('@')[0] || "",
                    bio: data.bio || "",
                    gender: data.gender || "",
                    date_of_birth: data.date_of_birth || "",
                    profile_image: data.profile_image || "",

                    phone: data.phone || "",
                    email: data.email || user.email || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    pincode: data.pincode || "",

                    occupation: data.occupation || "",
                    monthly_income: data.monthly_income ? data.monthly_income.toString() : "",
                    pan_number: data.pan_number || "",
                    aadhar_number: data.aadhar_number || "",

                    email_notifications: data.email_notifications ?? true,
                    kyc_status: data.kyc_status || "not_started",
                    kyc_documents: data.kyc_documents || {},
                    kyc_rejection_reason: data.kyc_rejection_reason || "",
                    kyc_submitted_at: data.kyc_submitted_at || "",
                    kyc_match_score: data.kyc_match_score || 0,
                    kyc_liveness_verified: data.kyc_liveness_verified || false,
                    document_hashes: data.document_hashes || {}
                });

                if (data.credit_score) {
                    setScore(data.credit_score);
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    email: user.email || "",
                    full_name: user.user_metadata?.full_name || "",
                }));
            }
        };
        fetchProfile();
    }, [user]);

    // Check if user has a PIN
    useEffect(() => {
        const checkPin = async () => {
            if (!user?.id) return;
            const { data, error } = await supabase.rpc('has_transaction_pin');
            if (!error && data !== null) {
                setPinData(prev => ({ ...prev, hasPin: !!data }));
            }
        };
        checkPin();
    }, [user]);

    const handleSetPin = async () => {
        if (pinData.pin.length !== 6) {
            showAlert("Invalid PIN", "Please enter a 6-digit PIN.", "warning");
            return;
        }

        if (pinData.pin !== pinData.confirmPin) {
            showAlert("Mismatch", "PINs do not match. Please re-enter carefully.", "warning");
            return;
        }

        setPinLoading(true);
        try {
            const { data, error } = await supabase.rpc('set_transaction_pin', {
                new_pin: pinData.pin
            });

            if (error) throw error;

            if (data?.success) {
                showAlert("Success", "Transaction PIN set successfully!", "success");
                setPinData(prev => ({ ...prev, pin: "", confirmPin: "", hasPin: true }));
                if (onUpdate) onUpdate();
            } else {
                showAlert("Error", data?.error || "Failed to set PIN", "error");
            }
        } catch (error: unknown) {
            console.error("Error setting PIN:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            showAlert("System Error", `Failed to set Transaction PIN: ${errorMessage}`, "error");
        } finally {
            setPinLoading(false);
        }
    };

    const handleCheckScore = async () => {
        // 1. Basic Length Check
        if (!formData.pan_number || formData.pan_number.length !== 10) {
            showAlert("Invalid PAN", "Please enter a valid 10-digit PAN Number.", "warning");
            return;
        }

        // 2. format Check (Regex)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(formData.pan_number)) {
            showAlert("Invalid Format", "Invalid PAN Format! It must be 5 letters, 4 numbers, then 1 letter (e.g. ABCDE1234F).", "warning");
            return;
        }

        setCheckingScore(true);

        try {
            // Check for duplicate PAN before proceeding
            const { data: existingPan } = await supabase
                .from("profiles")
                .select("id")
                .eq("pan_number", formData.pan_number)
                .neq("id", user.id)
                .maybeSingle();

            if (existingPan) {
                showAlert("Identity Conflict", "This PAN number is already registered with another account. Please use your own identity details.", "error");
                setCheckingScore(false);
                return;
            }

            // Removed Artificial API delay
            // Mock Logic: Generate score based on PAN hash + Income
            const panSum = formData.pan_number.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            let baseScore = 650;
            if (formData.monthly_income && parseFloat(formData.monthly_income) > 50000) baseScore += 50;
            if (formData.monthly_income && parseFloat(formData.monthly_income) > 100000) baseScore += 50;

            const calculatedScore = Math.min(900, Math.max(300, baseScore + (panSum % 150)));

            setScore(calculatedScore);

            // Save to DB
            await supabase.from("profiles").update({
                credit_score: calculatedScore,
                pan_number: formData.pan_number
            }).eq("id", user.id);

        } catch (e: unknown) {
            console.error("Score check error:", e);
            showAlert("System Error", `Error: ${e instanceof Error ? e.message : 'Unknown error'}`, "error");
        } finally {
            setCheckingScore(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/profile.${fileExt}`;

        setLoading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

            setFormData(prev => ({ ...prev, profile_image: publicUrl }));

            const { error: dbError } = await supabase.from("profiles").upsert({
                id: user.id,
                profile_image: publicUrl,
                updated_at: new Date().toISOString()
            });

            if (dbError) throw dbError;

            showAlert("Success", "Profile image updated successfully!", "success");
        } catch (error: unknown) {
            console.error('Error uploading image:', error);
            showAlert("Upload Error", `Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImage = async () => {
        showAlert(
            "Remove Photo",
            "Are you sure you want to remove your profile photo?",
            "confirm",
            async () => {
                setLoading(true);
                try {
                    // 1. Update Profile in DB (set to null)
                    const { error: dbError } = await supabase
                        .from("profiles")
                        .update({
                            profile_image: null,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", user.id);

                    if (dbError) throw dbError;

                    // 2. Try to clean up Storage if possible
                    const currentUrl = formData.profile_image;
                    if (currentUrl && currentUrl.includes(user.id)) {
                        try {
                            const urlParts = currentUrl.split('?')[0].split('.');
                            const ext = urlParts[urlParts.length - 1];
                            const filePath = `${user.id}/profile.${ext}`;

                            await supabase.storage
                                .from('avatars')
                                .remove([filePath]);
                        } catch (storageErr) {
                            console.warn("Storage cleanup failed (non-critical):", storageErr);
                        }
                    }

                    // 3. Update local state
                    setFormData(prev => ({ ...prev, profile_image: "" }));
                    showAlert("Photo Removed", "Profile photo removed.", "success");
                } catch (error: unknown) {
                    console.error("Error removing photo:", error);
                    showAlert("Error", `Failed to remove photo: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
                } finally {
                    setLoading(false);
                }
            }
        );
    };
    const handleSave = async () => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    full_name: formData.full_name,
                    username: formData.username,
                    bio: formData.bio,
                    gender: formData.gender,
                    date_of_birth: formData.date_of_birth || null,
                    profile_image: formData.profile_image,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    occupation: formData.occupation,
                    monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
                    pan_number: formData.pan_number,
                    aadhar_number: formData.aadhar_number,
                    email_notifications: formData.email_notifications,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error("Update failed:", error);
                if (error.code === '23505') {
                    if (error.message.includes('pan_number')) {
                        showAlert("Identity Error", "Identity Error: This PAN number is already linked to another account.", "error");
                    } else if (error.message.includes('aadhar_number')) {
                        showAlert("Identity Error", "Identity Error: This Aadhar number is already linked to another account.", "error");
                    } else if (error.message.includes('phone')) {
                        showAlert("Identity Error", "This phone number is already in use.", "error");
                    } else {
                        showAlert("Conflict", "A conflict occurred: One of your unique identifiers is already in use.", "error");
                    }
                    setLoading(false);
                    return;
                }
                if (error.code === '42501') {
                    showAlert("Permission Denied", "Permission denied! RLS Policy issue.", "error");
                }
                throw error;
            }

            showAlert("Success", "Profile updated successfully!", "success");
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            showAlert("Error", `Failed to save: ${errorMessage}`, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!kycFiles.id_front) return;
        const url = URL.createObjectURL(kycFiles.id_front);
        return () => URL.revokeObjectURL(url);
    }, [kycFiles.id_front]);

    // Track the current URL manually since useEffect doesn't return a value for use in render
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
        if (score === 0) {
            console.warn(`KYC: AI Match Score is 0%. Notes: ${notes}`);
        }
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
        // Validation
        if (!kycFiles.id_front || !kycFiles.id_back || !kycFiles.pan_card || (!kycFiles.selfie && !capturedSelfie)) {
            showAlert("Missing Documents", "Please upload/capture all 4 documents to submit for verification.", "warning");
            return;
        }

        setKycUploading(true);
        try {
            const documentUrls: { [key: string]: string } = {};
            const currentHashes: { [key: string]: string } = {};

            // Helper to convert dataURL to File
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

            // Prepare list of files with compression
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

                // Also get hash for duplicate detection
                currentHashes.selfie = await calculateHash(selfieFile);
            } else if (kycFiles.selfie) {
                currentHashes.selfie = await calculateHash(kycFiles.selfie);
            }

            // Calculate hashes for other files
            if (kycFiles.id_front) currentHashes.id_front = await calculateHash(kycFiles.id_front);
            if (kycFiles.id_back) currentHashes.id_back = await calculateHash(kycFiles.id_back);
            if (kycFiles.pan_card) currentHashes.pan_card = await calculateHash(kycFiles.pan_card);

            // Check for duplicate hashes in DB
            for (const [key, hash] of Object.entries(currentHashes)) {
                // Check if this hash exists for any OTHER user
                const { data: duplicateUser } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .neq("id", user.id)
                    .contains('document_hashes', { [key]: hash })
                    .maybeSingle();

                if (duplicateUser) {
                    showAlert("Security Alert", `The document you uploaded for ${key.replace('_', ' ')} has already been used by another account. Please upload your own original documents.`, "error");
                    setKycUploading(false);
                    return;
                }
            }

            // 1. Upload files to storage
            for (const [key, file] of Object.entries(filesToUpload)) {
                if (!file) continue;

                const fileExt = file.name.split('.').pop();
                const filePath = `${user.id}/${key}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('kyc-documents')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Securely store the PATH instead of a public URL
                documentUrls[key] = filePath;
            }

            // 2. Add AI notes to the documents object for admin review
            if (capturedSelfie?.notes) {
                documentUrls.ai_notes = capturedSelfie.notes;
            }

            // 3. Update profile with pending status, document URLs, and hashes
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
            showAlert("Verification Submitted", `KYC submitted! AI Match Score: ${capturedSelfie?.score ?? (kycFiles.selfie ? 'Manual Verify' : '0')}%`, "success");
        } catch (error: unknown) {
            console.error("KYC submission error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            showAlert("Submission Failed", `Failed to submit KYC: ${errorMessage}`, "error");
        } finally {
            setKycUploading(false);
        }
    };

    const handleResetKYC = async () => {
        showAlert(
            "Reset KYC",
            "Are you sure you want to reset your KYC? You will need to re-upload all documents. This is useful if you made a mistake or your verification failed.",
            "confirm",
            async () => {
                setLoading(true);
                try {
                    const { error: resetErr } = await supabase
                        .from("profiles")
                        .update({
                            kyc_status: 'not_started',
                            kyc_rejection_reason: "",
                            kyc_match_score: 0,
                            kyc_liveness_verified: false
                        })
                        .eq("id", user.id);

                    if (resetErr) throw resetErr;

                    setFormData(prev => ({
                        ...prev,
                        kyc_status: 'not_started',
                        kyc_rejection_reason: ""
                    }));
                    setKycFiles({
                        id_front: null,
                        id_back: null,
                        pan_card: null,
                        selfie: null
                    });
                    setCapturedSelfie(null);
                    setIdCardPreviewUrl(null);

                    if (onUpdate) onUpdate();
                    showAlert("Reset Complete", "KYC has been reset. You can now re-upload your documents.", "success");
                } catch (err: unknown) {
                    console.error("KYC reset error:", err);
                    showAlert("Reset Failed", `Failed to reset KYC: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const handleDeleteAccount = async () => {
        showAlert(
            "Delete Account",
            "Are you ABSOLUTELY sure you want to delete your account? This action cannot be undone and will permanently erase all your data.",
            "confirm",
            async () => {
                setLoading(true);
                try {
                    // Attempt to delete via Secure RPC
                    const { error } = await supabase.rpc('delete_user_account');

                    if (error) {
                        console.error("Deletion failed:", error);
                        showAlert("Deletion Error", `Cannot delete account: ${error.message}`, "error");
                        return;
                    }

                    // If we succeed, sign out and redirect
                    await supabase.auth.signOut();
                    window.location.href = "/";

                } catch (error: unknown) {
                    console.error("Fatal deletion error:", error);
                    showAlert("System Error", "An unexpected error occurred while trying to delete your account.", "error");
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    if (!user) {
        return <div className="p-10 text-center">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Complete Your Profile</h2>
                <p className="text-slate-500 font-medium">Provide your details to unlock full platform features.</p>
            </div>

            {/* 1. Personal Details */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Personal Details</CardTitle>
                                <CardDescription>Basic information about you.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                    <AvatarImage src={formData.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="object-cover" />
                                    <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-3xl">
                                        {user?.email?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="w-full flex flex-col gap-2">
                                    <Label htmlFor="avatar-upload" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                        <User className="h-3 w-3" />
                                        Upload Photo
                                    </Label>
                                    {formData.profile_image && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            disabled={loading}
                                            className="text-rose-500 hover:text-rose-600 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </button>
                                    )}
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</Label>
                                    <Input
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</Label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full flex h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bio</Label>
                                    <textarea
                                        className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20"
                                        rows={2}
                                        placeholder="Tell us a little about yourself..."
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* 2. Contact & Location */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Contact & Location</CardTitle>
                                <CardDescription>Where can we reach you?</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email (Read Only)</Label>
                                <Input value={formData.email} disabled className="rounded-xl border-slate-200 bg-slate-100 text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91..."
                                    className="rounded-xl border-slate-200 bg-slate-50/50"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="rounded-xl border-slate-200 bg-slate-50/50"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 md:col-span-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">State</Label>
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pincode</Label>
                                    <Input
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="rounded-xl border-slate-200 bg-slate-50/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* 3. Financial & Credit Score (Replaces old Professional Info) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Financial Profile</CardTitle>
                                <CardDescription>Your creditworthiness and employment.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left: Form */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aadhar Card Number</Label>
                                        <Input
                                            value={formData.aadhar_number}
                                            onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                                            placeholder="12-digit Aadhar Number"
                                            maxLength={12}
                                            className="rounded-xl border-slate-200 bg-slate-50/50 font-bold tracking-[0.2em]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">PAN Card Number</Label>
                                        <Input
                                            value={formData.pan_number}
                                            onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                            className="rounded-xl border-slate-200 bg-slate-50/50 font-mono tracking-widest uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Occupation</Label>
                                        <Input
                                            value={formData.occupation}
                                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                            placeholder="Engineer..."
                                            className="rounded-xl border-slate-200 bg-slate-50/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Income</Label>
                                        <Input
                                            type="number"
                                            value={formData.monthly_income}
                                            onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                                            placeholder="₹"
                                            className="rounded-xl border-slate-200 bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCheckScore}
                                    disabled={checkingScore || !formData.pan_number}
                                    className="w-full bg-slate-900 text-white font-bold rounded-xl h-12 shadow-lg hover:translate-y-[-2px] transition-all"
                                >
                                    {checkingScore ? "Connecting to Bureau..." : "Check Credit Score"}
                                </Button>
                            </div>

                            {/* Right: Gauge */}
                            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                {score !== null || checkingScore ? (
                                    <CreditScoreGauge score={score || 0} loading={checkingScore} />
                                ) : (
                                    <div className="text-center space-y-2 text-slate-400">
                                        <Shield className="h-12 w-12 mx-auto opacity-20" />
                                        <p className="font-medium text-sm">Enter PAN & Income to fetch score</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Transaction Security (PIN) moved up since KYC is gone */}

            {/* 5. Transaction Security (PIN) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Transaction Security</CardTitle>
                                <CardDescription>Secure your withdrawals and investments with a PIN.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-4 w-full">
                                {pinData.hasPin ? (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-black text-emerald-900">Transaction PIN is Active</p>
                                            <p className="text-xs font-medium text-emerald-700/80 mt-0.5">Your wallet is now protected. Enter below to change your PIN.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-orange-500" />
                                        <div>
                                            <p className="text-sm font-black text-orange-900">No Transaction PIN Set</p>
                                            <p className="text-xs font-medium text-orange-700/80 mt-0.5">Highly recommended to protect your funds.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">{pinData.hasPin ? "New 6-Digit PIN" : "Set 6-Digit PIN"}</Label>
                                        <Input
                                            type="password"
                                            maxLength={6}
                                            placeholder="••••••"
                                            value={pinData.pin}
                                            onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '') })}
                                            className="rounded-xl border-slate-200 bg-slate-50/50 text-center font-black tracking-[1em] text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm PIN</Label>
                                        <Input
                                            type="password"
                                            maxLength={6}
                                            placeholder="••••••"
                                            value={pinData.confirmPin}
                                            onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                            className="rounded-xl border-slate-200 bg-slate-50/50 text-center font-black tracking-[1em] text-lg"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSetPin}
                                    disabled={pinLoading || pinData.pin.length !== 6 || pinData.pin !== pinData.confirmPin}
                                    className="w-full bg-slate-900 text-white font-bold rounded-xl h-12 shadow-lg hover:translate-y-[-2px] transition-all uppercase tracking-widest text-[10px]"
                                >
                                    {pinLoading ? "Securing..." : pinData.hasPin ? "Update Transaction PIN" : "Enable PIN Protection"}
                                </Button>
                            </div>
                            <div className="hidden lg:block w-48 text-center space-y-2 opacity-40">
                                <Shield className="h-16 w-16 mx-auto text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-tighter">Double-Layer Security Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Notifications</CardTitle>
                                <CardDescription>Manage how you want to be notified.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-slate-900">Email Alerts</Label>
                                <p className="text-sm text-slate-500 font-medium">Receive emails about your account activity.</p>
                            </div>
                            <Switch
                                checked={formData.email_notifications}
                                onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="lg"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 px-8"
                >
                    {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                </Button>
            </div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-8 border-t border-slate-100">
                <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-black text-red-900 mb-1">Delete Account</h4>
                        <p className="text-sm text-red-700/70 font-medium">Permanently remove your account and all data.</p>
                    </div>
                    <Button onClick={handleDeleteAccount} variant="destructive" className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 font-bold shadow-none">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                </div>
            </motion.div>

            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div >
    );
}
