"use client";

import { useDashboard } from "@/context/DashboardContext";
import { TransactionsView } from "@/components/dashboard/TransactionsView";

export default function TransactionsPage() {
    const { user } = useDashboard();

    if (!user) return null;

    return <TransactionsView userId={user.id} />;
}
