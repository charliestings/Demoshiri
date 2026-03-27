"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { Profile, Loan, Investment, AlertType } from "@/types";

interface DashboardContextType {
    user: any;
    profile: Profile | null;
    isAdmin: boolean;
    kycStatus: string;
    loading: boolean;
    loans: Loan[];
    investments: Investment[];
    unreadNotifications: number;
    fetchData: () => Promise<void>;
    
    // Global Alert State
    alertConfig: {
        open: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
    };
    showAlert: (title: string, message: string, type?: AlertType, onConfirm?: () => void) => void;
    closeAlert: () => void;
    
    // PIN states (common for invest/repay)
    isPinModalOpen: boolean;
    setIsPinModalOpen: (open: boolean) => void;
    pinPurpose: "investment" | "repayment";
    setPinPurpose: (purpose: "investment" | "repayment") => void;
    pinAction: () => Promise<void>;
    setPinAction: (action: () => Promise<void>) => void;
    
    // Success Modals
    showInvestSuccess: boolean;
    setShowInvestSuccess: (show: boolean) => void;
    lastInvestAmount: number;
    setLastInvestAmount: (amount: number) => void;
    lastInvestPurpose: string;
    setLastInvestPurpose: (purpose: string) => void;
    
    showRepaySuccess: boolean;
    setShowRepaySuccess: (show: boolean) => void;
    lastRepayAmount: number;
    setLastRepayAmount: (amount: number) => void;
    lastRepayPurpose: string;
    setLastRepayPurpose: (purpose: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [kycStatus, setKycStatus] = useState<string>("none");
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const [alertConfig, setAlertConfig] = useState({
        open: false,
        title: "",
        message: "",
        type: "info" as AlertType,
        onConfirm: undefined as (() => void) | undefined
    });

    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinPurpose, setPinPurpose] = useState<"investment" | "repayment">("investment");
    const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => { });

    const [showInvestSuccess, setShowInvestSuccess] = useState(false);
    const [lastInvestAmount, setLastInvestAmount] = useState(0);
    const [lastInvestPurpose, setLastInvestPurpose] = useState("");

    const [showRepaySuccess, setShowRepaySuccess] = useState(false);
    const [lastRepayAmount, setLastRepayAmount] = useState(0);
    const [lastRepayPurpose, setLastRepayPurpose] = useState("");

    const showAlert = (title: string, message: string, type: AlertType = "info", onConfirm?: () => void) => {
        setAlertConfig({ open: true, title, message, type, onConfirm });
    };

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, open: false }));

    const fetchData = useCallback(async () => {
        if (!user) return;

        const [
            { data: loansData },
            { data: investData },
            { count: notifCount }
        ] = await Promise.all([
            supabase.from("loans").select("*, profiles(*)").order("created_at", { ascending: false }).limit(100),
            supabase.from("investments").select("*, loans(*)").eq("investor_id", user.id).limit(100),
            supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("is_read", false)
        ]);

        if (loansData) setLoans(loansData);
        if (investData) setInvestments(investData);
        if (notifCount !== null) setUnreadNotifications(notifCount);
        
        // Refresh profile to get latest KYC status
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) {
            setProfile(profileData);
            setKycStatus(profileData.kyc_status);
            setIsAdmin(profileData.is_admin);
        }
    }, [user]);

    useEffect(() => {
        let mounted = true;
        const checkUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!mounted) return;
            
            if (!authUser) {
                router.push("/login");
                return;
            }
            
            setUser((prev: any) => prev?.id === authUser.id ? prev : authUser);

            const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
            if (profileData && mounted) {
                setProfile(profileData);
                setKycStatus(profileData.kyc_status);
                setIsAdmin(profileData.is_admin);
            }
            if (mounted) setLoading(false);
        };

        checkUser();
        
        return () => {
            mounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    return (
        <DashboardContext.Provider value={{
            user, profile, isAdmin, kycStatus, loading, loans, investments, unreadNotifications, fetchData,
            alertConfig, showAlert, closeAlert,
            isPinModalOpen, setIsPinModalOpen, pinPurpose, setPinPurpose, pinAction, setPinAction,
            showInvestSuccess, setShowInvestSuccess, lastInvestAmount, setLastInvestAmount, lastInvestPurpose, setLastInvestPurpose,
            showRepaySuccess, setShowRepaySuccess, lastRepayAmount, setLastRepayAmount, lastRepayPurpose, setLastRepayPurpose
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
};
