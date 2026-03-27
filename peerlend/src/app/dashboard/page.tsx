"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
    const router = useRouter();

    useEffect(() => {
        // Redirect the root /dashboard page to the specialized overview page
        router.replace("/dashboard/overview");
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-[#fffcfc] z-50 fixed inset-0">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
    );
}
