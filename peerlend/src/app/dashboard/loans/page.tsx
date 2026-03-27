"use client";

import { useDashboard } from "@/context/DashboardContext";
import { BorrowerView } from "@/components/dashboard/BorrowerView";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoansPage() {
    const { 
        user,
        profile,
        loans,
        fetchData,
        kycStatus,
        setIsPinModalOpen,
        setPinPurpose,
        setPinAction,
        setShowRepaySuccess,
        setLastRepayAmount,
        setLastRepayPurpose,
        showAlert
    } = useDashboard();
    
    const router = useRouter();

    if (!user) return null;

    return (
        <BorrowerView
            loans={loans.filter(l => l.borrower_id === user.id)}
            userId={user.id}
            onLoanCreated={fetchData}
            kycStatus={kycStatus}
            userProfile={profile || undefined}
            onShowWallet={() => router.push("/dashboard/wallet")}
            onShowRepaySuccess={(amt: number, purpose: string) => {
                setLastRepayAmount(amt);
                setLastRepayPurpose(purpose);
                setShowRepaySuccess(true);
            }}
            onRepayClick={(loan) => {
                setPinPurpose("repayment");
                setPinAction(() => async () => {
                    if (!loan) return;
                    const repaymentAmount = loan.amount + (loan.amount * (loan.interest_rate / 100));
                    try {
                        const { data, error: repayError } = await supabase.rpc('process_loan_repayment', {
                            borrower_uid: user.id,
                            target_loan_id: loan.id
                        });

                        if (repayError) {
                            console.error("Repayment RPC Error:", repayError);
                            throw new Error(repayError.message || 'Repayment failed');
                        }

                        if (data && data.success === false) {
                            showAlert("Repayment Failed", data.error || "Failed to process repayment", "error");
                            return;
                        }

                        setShowRepaySuccess(true);
                        setLastRepayAmount(repaymentAmount);
                        setLastRepayPurpose(loan.purpose);
                        fetchData();
                    } catch (err: unknown) {
                        console.error("Repayment error:", err);
                        showAlert("System Error", "Repayment failed: " + (err instanceof Error ? err.message : "Unknown error"), "error");
                    }
                });
                setIsPinModalOpen(true);
            }}
        />
    );
}
