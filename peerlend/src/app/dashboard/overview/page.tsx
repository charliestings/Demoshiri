"use client";

import { useDashboard } from "@/context/DashboardContext";
import { OverviewStats } from "@/components/dashboard/OverviewStats";

export default function OverviewPage() {
    const { profile, loans, investments, kycStatus } = useDashboard();
    const userRole = profile?.is_admin ? "admin" : "member";

    return (
        <OverviewStats 
            mode={userRole as any}
            loans={loans}
            investments={investments}
            kycStatus={kycStatus}
        />
    );
}
