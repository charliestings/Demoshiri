"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { loginSchema } from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthFieldErrors } from "@/types/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        // Validation using centralized Zod schema
        const result = loginSchema.safeParse({ email, password });

        if (!result.success) {
            const errors: AuthFieldErrors = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof AuthFieldErrors;
                if (!errors[path]) {
                    errors[path] = issue.message;
                }
            });
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    };

    return (
        <AuthLayout
            title="Sign In"
            subtitle="Access your platform dashboard and manage your capital."
            sideTitle={<>Welcome <br /><span className="text-orange-200">Back</span></>}
            sideSubtitle="Access your account and manage your capital."
            sideDecoration="Login"
            backLink={{ href: "/", label: "Home" }}
        >
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    <AuthFormField
                        id="email"
                        type="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        value={email}
                        error={fieldErrors.email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                        }}
                        required
                    />

                    <AuthFormField
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        error={fieldErrors.password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                        }}
                        required
                        rightElement={
                            <Link href="/forgot-password" title="Recover your password" className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase">
                                Forgot?
                            </Link>
                        }
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
                            Signing in...
                        </>
                    ) : (
                        "Continue to Dashboard"
                    )}
                </Button>

                <div className="text-center text-sm text-slate-500 pt-6 font-medium">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-rose-600 hover:text-rose-700 font-black underline-offset-4 hover:underline">
                        Get Started
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}
