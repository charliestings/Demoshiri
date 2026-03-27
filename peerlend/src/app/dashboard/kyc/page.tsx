"use client";

import { useDashboard } from "@/context/DashboardContext";
import { KYCView } from "@/components/dashboard/KYCView";

export default function KYCPage() {
    const { user, fetchData } = useDashboard();

    if (!user) return null;

    return <KYCView user={user} onUpdate={fetchData} />;
}
