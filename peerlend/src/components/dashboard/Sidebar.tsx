"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Briefcase,
    PiggyBank,
    Settings,
    LogOut,
    UserCircle,
    Wallet,
    FileText,
    Activity,
    Home as HomeIcon,
    Bell
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: "borrower" | "lender";
    isAdmin?: boolean;
    userEmail?: string;
    unreadNotifications?: number;
}

export function Sidebar({ activeTab, setActiveTab, userRole, isAdmin, userEmail, unreadNotifications }: SidebarProps) {
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "wallet", label: "My Wallet", icon: Wallet },
        { id: "market", label: "Explore Loans", icon: PiggyBank },
        { id: "loans", label: "Borrow (My Loans)", icon: Wallet },
        { id: "notifications", label: "Notifications", icon: Bell, count: unreadNotifications },
        { id: "transactions", label: "Transactions", icon: FileText },
        ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: Activity }] : []),
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const handleNav = (id: string) => {
        setActiveTab(id);
    };

    return (
        <div className="w-64 bg-slate-950 h-screen flex flex-col fixed left-0 top-0 border-r border-white/5 shadow-[20px_0_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
            {/* Dark Sunset Accents */}
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-rose-600/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-[20%] right-[-20%] w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] -z-10" />

            {/* Brand */}
            <div className="p-8 border-b border-white/5 mb-4 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                        <span className="font-bold text-xl uppercase italic">P</span>
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">
                        PeerLend
                    </h1>
                </div>
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.25em]">
                    Smart Capital
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={cn(
                                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-white shadow-inner border border-white/10"
                                    : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-bg"
                                    className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 opacity-100"
                                />
                            )}
                            <item.icon className={cn(
                                "h-5 w-5 transition-transform duration-300 relative z-10",
                                isActive ? "text-orange-400 scale-110" : "text-slate-600 group-hover:text-orange-400 group-hover:scale-110"
                            )} />
                            <span className="font-bold text-[13px] tracking-tight relative z-10">{item.label}</span>
                            {item.count && item.count > 0 ? (
                                <span className="absolute right-4 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/40 animate-pulse z-10">
                                    {item.count}
                                </span>
                            ) : null}
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute left-0 w-1 h-6 bg-gradient-to-b from-orange-500 to-rose-600 rounded-r-full shadow-[0_0_15px_rgba(244,63,94,0.6)] z-20"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-3xl">
                <div className="flex items-center space-x-3 mb-5 px-1 relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black border-2 border-slate-900 shadow-xl relative z-10">
                        {userEmail ? userEmail[0].toUpperCase() : <UserCircle className="h-6 w-6" />}
                    </div>
                    <div className="overflow-hidden relative z-10">
                        <p className="text-sm font-black text-white truncate w-32">{userEmail || "User"}</p>
                        <p className="text-[10px] text-rose-500 uppercase font-black tracking-wider">{isAdmin ? "Admin" : userRole}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl px-4 h-11 border border-transparent"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
