"use client";

import { useDashboard } from "@/context/DashboardContext";
import { LenderView } from "@/components/dashboard/LenderView";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ExplorePage() {
    const { 
        user,
        loans,
        fetchData,
        kycStatus,
        setIsPinModalOpen,
        setPinPurpose,
        setPinAction,
        setShowInvestSuccess,
        setLastInvestAmount,
        setLastInvestPurpose,
        showAlert
    } = useDashboard();
    
    const router = useRouter();

    if (!user) return null;

    return (
        <LenderView
            loans={loans.filter(l => l.status === 'approved' && l.borrower_id !== user.id)}
            userId={user.id}
            onInvested={fetchData}
            kycStatus={kycStatus}
            onShowWallet={() => router.push("/dashboard/wallet")}
            onShowSuccess={(amt, purpose) => {
                setLastInvestAmount(amt);
                setLastInvestPurpose(purpose);
                setShowInvestSuccess(true);
            }}
            onInvestClick={(loan, amount) => {
                setPinPurpose("investment");
                setPinAction(() => async () => {
                    try {
                        const { data, error: investError } = await supabase.rpc('process_loan_investment', {
                            investor_uid: user.id,
                            target_loan_id: loan.id,
                            invest_amount: amount
                        });

                        if (investError) {
                            console.error("Investment RPC Error:", investError);
                            throw new Error(investError.message || 'Investment failed');
                        }

                        if (data && data.success === false) {
                            showAlert("Investment Failed", data.error || "Failed to process investment", "error");
                            return;
                        }

                        setShowInvestSuccess(true);
                        setLastInvestAmount(amount);
                        setLastInvestPurpose(loan.purpose);
                        fetchData();
                    } catch (err: unknown) {
                        console.error("Investment error:", err);
                        const errorMessage = err instanceof Error ? err.message : "Unknown error";
                        showAlert("System Error", "Investment failed: " + errorMessage, "error");
                    }
                });
                setIsPinModalOpen(true);
            }}
        />
    );
}
