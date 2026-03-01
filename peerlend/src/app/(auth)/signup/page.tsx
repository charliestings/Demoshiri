"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";

import {
    signupStep0Schema,
    signupStep1Schema,
    signupStep2Schema,
    signupStep3Schema,
} from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthFieldErrors } from "@/types/auth";

export default function SignupPage() {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Form Data State
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        dob: "",
        gender: "male" as "male" | "female" | "other",
        occupation: "",
        monthlyIncome: "",
        role: "borrower" as "borrower" | "lender",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field as keyof AuthFieldErrors]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const nextStep = () => {
        const schemas = [signupStep0Schema, signupStep1Schema, signupStep2Schema, signupStep3Schema];
        const result = schemas[step].safeParse(formData);

        if (!result.success) {
            const errors: AuthFieldErrors = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof AuthFieldErrors;
                if (!errors[path]) errors[path] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setStep((prev) => prev + 1);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        const result = signupStep3Schema.safeParse(formData);
        if (!result.success) {
            const errors: AuthFieldErrors = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as keyof AuthFieldErrors;
                if (!errors[path]) errors[path] = issue.message;
            });
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        // Metadata construction with snake_case for Supabase
        const metadata = {
            full_name: formData.fullName,
            phone: formData.phone,
            date_of_birth: formData.dob,
            gender: formData.gender,
            occupation: formData.occupation,
            monthly_income: parseFloat(formData.monthlyIncome) || 0,
            role: formData.role,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
        };

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: metadata,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // Double-Safe Logic: Manually update profile (important for current DB setup)
        if (authData?.user) {
            await supabase
                .from('profiles')
                .update({
                    full_name: metadata.full_name,
                    phone: metadata.phone,
                    date_of_birth: metadata.date_of_birth || null,
                    gender: metadata.gender,
                    occupation: metadata.occupation,
                    monthly_income: metadata.monthly_income,
                    role: metadata.role,
                    address: metadata.address,
                    city: metadata.city,
                    state: metadata.state,
                    pincode: metadata.pincode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', authData.user.id);
        }

        setSuccess(true);
        setLoading(false);
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <AuthFormField
                            id="email"
                            type="email"
                            label="Email Address"
                            placeholder="name@example.com"
                            value={formData.email}
                            error={fieldErrors.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            required
                        />
                        <AuthFormField
                            id="password"
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={formData.password}
                            error={fieldErrors.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            required
                        />
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <AuthFormField
                            id="fullName"
                            label="Full Name"
                            placeholder="John Doe"
                            value={formData.fullName}
                            error={fieldErrors.fullName}
                            onChange={(e) => updateField("fullName", e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <AuthFormField
                                id="phone"
                                label="Phone Number"
                                placeholder="9876543210"
                                value={formData.phone}
                                error={fieldErrors.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                required
                            />
                            <AuthFormField
                                id="dob"
                                type="date"
                                label="Date of Birth"
                                value={formData.dob}
                                error={fieldErrors.dob}
                                onChange={(e) => updateField("dob", e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Gender</label>
                            <div className="grid grid-cols-3 gap-3">
                                {["male", "female", "other"].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => updateField("gender", g as any)}
                                        className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${formData.gender === g ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-100/50 border-slate-200 text-slate-500 hover:border-rose-200'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <AuthFormField
                            id="occupation"
                            label="Occupation"
                            placeholder="Software Engineer"
                            value={formData.occupation}
                            error={fieldErrors.occupation}
                            onChange={(e) => updateField("occupation", e.target.value)}
                            required
                        />
                        <AuthFormField
                            id="monthlyIncome"
                            type="number"
                            label="Monthly Income (₹)"
                            placeholder="50000"
                            value={formData.monthlyIncome}
                            error={fieldErrors.monthlyIncome}
                            onChange={(e) => updateField("monthlyIncome", e.target.value)}
                            required
                        />
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Primary Goal</label>
                            <div className="grid grid-cols-2 gap-3">
                                {["borrower", "lender"].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => updateField("role", r as any)}
                                        className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${formData.role === r ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100/50 border-slate-200 text-slate-500 hover:border-orange-200'}`}
                                    >
                                        {r === "borrower" ? "I want to borrow" : "I want to invest"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <AuthFormField
                            id="address"
                            label="Full Address"
                            placeholder="Flat, Street, Area"
                            value={formData.address}
                            error={fieldErrors.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <AuthFormField
                                id="city"
                                label="City"
                                placeholder="Mumbai"
                                value={formData.city}
                                error={fieldErrors.city}
                                onChange={(e) => updateField("city", e.target.value)}
                                required
                            />
                            <AuthFormField
                                id="state"
                                label="State"
                                placeholder="Maharashtra"
                                value={formData.state}
                                error={fieldErrors.state}
                                onChange={(e) => updateField("state", e.target.value)}
                                required
                            />
                        </div>
                        <AuthFormField
                            id="pincode"
                            label="Pincode"
                            placeholder="400001"
                            value={formData.pincode}
                            error={fieldErrors.pincode}
                            onChange={(e) => updateField("pincode", e.target.value)}
                            required
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const sideContents = [
        { title: <>Start Your <br /><span className="text-orange-200">Journey</span></>, subtitle: "Create an account to access smart capital and growth." },
        { title: <>Tell Us <br /><span className="text-orange-200">More</span></>, subtitle: "Your personal details help us secure your identity." },
        { title: <>Financial <br /><span className="text-orange-200">Profile</span></>, subtitle: "Customize your experience based on your goals." },
        { title: <>Almost <br /><span className="text-orange-200">There</span></>, subtitle: "Complete your profile to unlock full platform access." },
    ];

    if (success) {
        return (
            <div className="w-full max-w-md mx-auto px-4">
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 p-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MailCheck className="h-10 w-10 text-orange-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Verify Email</h1>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                        We've sent a verification link to your email. <br />
                        Please check your inbox to activate your account.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-all"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout
            title={step === 3 ? "Final Step" : `Step ${step + 1}`}
            subtitle={step === 0 ? "Create your credentials to get started." : "Complete your profile information."}
            sideTitle={sideContents[step].title}
            sideSubtitle={sideContents[step].subtitle}
            sideDecoration={`Step ${step + 1}`}
            backLink={step === 0 ? { href: "/login", label: "Login" } : undefined}
        >
            <div className="mb-8">
                <div className="flex gap-2 h-1.5">
                    {[0, 1, 2, 3].map((s) => (
                        <div key={s} className={`flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-orange-500 to-rose-600' : 'bg-slate-100'}`} />
                    ))}
                </div>
            </div>

            <form onSubmit={step === 3 ? handleSignUp : (e) => { e.preventDefault(); nextStep(); }} className="space-y-8" noValidate>
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20">
                        {error}
                    </div>
                )}

                {renderStep()}

                <div className="flex gap-4">
                    {step > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(prev => prev - 1)}
                            className="h-14 px-8 border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-xl shadow-rose-500/20 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            step === 3 ? "Complete Registration" : "Next Step"
                        )}
                    </Button>
                </div>

                {step === 0 && (
                    <div className="text-center text-sm text-slate-500 pt-6 font-medium">
                        Already have an account?{" "}
                        <Link href="/login" className="text-rose-600 hover:text-rose-700 font-black underline-offset-4 hover:underline">
                            Sign In
                        </Link>
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}
