"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";

import { forgotPasswordSchema } from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthFieldErrors } from "@/types/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const [success, setSuccess] = useState(false);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        const result = forgotPasswordSchema.safeParse({ email });

        if (!result.success) {
            setFieldErrors({ email: result.error.issues[0].message });
            setLoading(false);
            return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="w-full max-w-md mx-auto px-4">
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 p-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MailCheck className="h-10 w-10 text-orange-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Check Your Inbox</h1>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                        We've sent a password reset link to <br />
                        <span className="font-black text-slate-800">{email}</span>.
                        Please follow the instructions to secure your account.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-all"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout
            title="Recover Account"
            subtitle="Enter your registered email address and we'll send you a recovery link."
            sideTitle={<>Forgot <br />Password?</>}
            sideSubtitle="Don't worry, happens to the best of us. Let's get you back in."
            sideDecoration="Reset"
            backLink={{ href: "/login", label: "Login" }}
        >
            <form onSubmit={handleResetRequest} className="space-y-8" noValidate>
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <AuthFormField
                    id="email"
                    type="email"
                    label="Email Address"
                    placeholder="name@example.com"
                    value={email}
                    error={fieldErrors.email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({});
                    }}
                    required
                />

                <Button
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-xl shadow-rose-500/20 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending Link...
                        </>
                    ) : (
                        "Send Recovery Link"
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
