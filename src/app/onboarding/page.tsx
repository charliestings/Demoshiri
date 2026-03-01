"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Briefcase, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login"); // or refresh
            } else {
                setUser(user);
            }
        };
        getUser();
    }, [router]);

    const handleRoleSelection = async (role: "borrower" | "lender") => {
        if (!user) return;
        setLoading(true);

        try {
            // Check if profile exists, if not create it, else update it
            const { error: upsertError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    full_name: user.email?.split('@')[0] || 'User',
                    // Note: role and email columns are missing in the DB
                    updated_at: new Date().toISOString(),
                });

            if (upsertError) throw upsertError;

            router.push("/dashboard");
            router.refresh();

        } catch (error) {
            console.error("Error updating profile:", error);
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to PeerLend</h1>
                    <p className="text-lg text-slate-500">How do you assume using the platform?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                            className="h-full cursor-pointer hover:border-orange-500/50 border-2 border-transparent transition-all group"
                            onClick={() => handleRoleSelection("borrower")}
                        >
                            <CardHeader>
                                <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Briefcase className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl">I want to Borrow</CardTitle>
                                <CardDescription>
                                    Get key loans with competitive rates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li>✓ Quick approval process</li>
                                    <li>✓ Transparent fees</li>
                                    <li>✓ Flexible repayment options</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                            className="h-full cursor-pointer hover:border-rose-500/50 border-2 border-transparent transition-all group"
                            onClick={() => handleRoleSelection("lender")}
                        >
                            <CardHeader>
                                <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <PiggyBank className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl">I want to Invest</CardTitle>
                                <CardDescription>
                                    Earn higher returns on your capital.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-slate-500">
                                    <li>✓ 8-12% Average APY</li>
                                    <li>✓ Diversified portfolio</li>
                                    <li>✓ Monthly payouts</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {loading && (
                    <div className="mt-8 flex justify-center text-slate-500 animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Setting up your profile...
                    </div>
                )}
            </div>
        </div>
    );
}
