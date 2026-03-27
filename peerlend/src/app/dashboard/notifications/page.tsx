"use client";

import { useDashboard } from "@/context/DashboardContext";
import { NotificationsView } from "@/components/dashboard/NotificationsView";

export default function NotificationsPage() {
    const { user } = useDashboard();

    if (!user) return null;

    return <NotificationsView userId={user.id} />;
}
