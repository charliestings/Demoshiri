"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { resetPasswordSchema } from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthFieldErrors } from "@/types/auth";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        const result = resetPasswordSchema.safeParse({ password, confirmPassword });

        if (!result.success) {
            const errors: AuthFieldErrors = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as keyof AuthFieldErrors] = issue.message;
            });
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        const { error: resetError } = await supabase.auth.updateUser({
            password: password
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
            router.push("/login");
        }, 3000);
    };

    if (success) {
        return (
            <div className="w-full max-w-md mx-auto px-4">
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 p-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Password Reset!</h1>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                        Your password has been successfully updated. <br />
                        You'll be redirected to the sign-in page in a moment.
                    </p>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-progress w-full origin-left" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout
            title="Set New Password"
            subtitle="Almost there! Please enter and confirm your new password below."
            sideTitle={<>Secure <br />Your Account</>}
            sideSubtitle="Create a strong, unique password to keep your capital safe."
            sideDecoration="Secure"
        >
            <form onSubmit={handleReset} className="space-y-6" noValidate>
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <AuthFormField
                        id="password"
                        type={showPassword ? "text" : "password"}
                        label="New Password"
                        placeholder="••••••••"
                        value={password}
                        error={fieldErrors.password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                        }}
                        required
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        }
                    />

                    <AuthFormField
                        id="confirmPassword"
                        type="password"
                        label="Confirm New Password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        error={fieldErrors.confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }}
                        required
                    />
                </div>

                <Button
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-xl shadow-rose-500/20 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Updating Password...
                        </>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
