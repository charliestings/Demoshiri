"use client";

import { useDashboard } from "@/context/DashboardContext";
import { WalletView } from "@/components/dashboard/WalletView";

export default function WalletPage() {
    const { user } = useDashboard();

    if (!user) return null;

    return <WalletView userId={user.id} />;
}
