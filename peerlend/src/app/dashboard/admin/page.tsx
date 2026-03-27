"use client";

import { useDashboard } from "@/context/DashboardContext";
import { AdminView } from "@/components/dashboard/AdminView";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Profile, ContactMessage } from "@/types";

export default function AdminPage() {
    const { user, isAdmin, loans, fetchData } = useDashboard();
    const [pendingKYCUsers, setPendingKYCUsers] = useState<Profile[]>([]);
    const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

    useEffect(() => {
        const fetchPendingKYC = async () => {
            if (isAdmin || user?.email?.includes('admin')) {
                const { data: kycData, error: kycError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("kyc_status", "pending")
                    .order("kyc_submitted_at", { ascending: true })
                    .limit(50);

                if (kycError) console.error("Error fetching KYC data:", kycError);
                else setPendingKYCUsers(kycData || []);
            }
        };

        const fetchMessages = async () => {
            if (isAdmin || user?.email?.includes('admin')) {
                const { data, error } = await supabase
                    .from("contact_messages")
                    .select("*")
                    .eq("status", "unread")
                    .order("created_at", { ascending: false });
                if (error) console.error("Error fetching messages:", error);
                else setContactMessages(data || []);
            }
        };

        if (user) {
            fetchPendingKYC();
            fetchMessages();
        }
    }, [user, isAdmin]);

    const handleLoanStatusUpdate = async (loanId: string, status: string) => {
        const { data: loanData } = await supabase
            .from("loans")
            .select("borrower_id, purpose, amount")
            .eq("id", loanId)
            .single();

        const { error } = await supabase
            .from("loans")
            .update({ status })
            .eq("id", loanId);

        if (error) {
            console.error("Error updating loan status:", error);
            alert("Failed to update loan status");
        } else {
            if (loanData) {
                try {
                    await supabase.from("notifications").insert({
                        user_id: loanData.borrower_id,
                        title: `Loan ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        message: `Your loan request for ₹${loanData.amount} (${loanData.purpose}) has been ${status}.`,
                        type: "loan_status_change",
                        link: "/dashboard/loans"
                    });
                } catch (notifyError) {
                    console.error("Error creating borrower notification:", notifyError);
                }
            }
            fetchData();
        }
    };

    const handleKYCUpdate = async (userId: string, status: 'approved' | 'rejected', reason?: string) => {
        const { error } = await supabase.rpc('verify_user_kyc', {
            payload: {
                target_user_id: userId,
                new_status: status,
                rejection_reason: reason || null
            }
        });

        if (error) {
            console.error("Error updating KYC status:", error);
            alert(`Failed to update KYC status: ${error.message || 'Unknown error'}`);
        } else {
            try {
                await supabase.from("notifications").insert({
                    user_id: userId,
                    title: `KYC Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                    message: status === 'approved'
                        ? 'Congratulations! Your identity verification is complete. You now have full platform access.'
                        : `Your identity verification was rejected. Reason: ${reason}. Please re-submit clear documents.`,
                    type: "kyc_status_change",
                    link: "/dashboard/kyc"
                });
            } catch (notifyError) {
                console.error("Error creating KYC notification:", notifyError);
            }
            fetchData();
            // Refresh KYC list
            const { data: kycData } = await supabase
                .from("profiles")
                .select("*")
                .eq("kyc_status", "pending")
                .order("kyc_submitted_at", { ascending: true });
            if (kycData) setPendingKYCUsers(kycData);
        }
    };

    const handleMessageRead = async (id: string) => {
        const { error } = await supabase
            .from("contact_messages")
            .update({ status: 'read' })
            .eq("id", id);
            
        if (!error) {
            setContactMessages(prev => prev.filter(m => m.id !== id));
        } else {
            console.error("Failed to mark message as read:", error);
        }
    };

    if (!user || (!isAdmin && !user.email?.includes('admin'))) return null;

    return (
        <AdminView
            loans={loans}
            kycUsers={pendingKYCUsers}
            contactMessages={contactMessages}
            onUpdate={handleLoanStatusUpdate}
            onKYCUpdate={handleKYCUpdate}
            onMessageRead={handleMessageRead}
        />
    );
}
