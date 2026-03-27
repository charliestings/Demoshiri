"use client";

import { useDashboard } from "@/context/DashboardContext";
import { SettingsView } from "@/components/dashboard/SettingsView";

export default function SettingsPage() {
    const { user, fetchData } = useDashboard();

    if (!user) return null;

    return <SettingsView user={user} onUpdate={fetchData} />;
}
