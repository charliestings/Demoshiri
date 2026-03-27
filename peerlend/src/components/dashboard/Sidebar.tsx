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
    Bell,
    X,
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    ShieldCheck
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { useDashboard } from "@/context/DashboardContext";

interface SidebarProps {
    activeTab: string;
    isOpen?: boolean;
    onClose?: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export function Sidebar({ 
    activeTab, 
    isOpen, 
    onClose,
    isExpanded = false,
    onToggleExpand
}: SidebarProps) {
    const router = useRouter();
    const { profile, isAdmin, unreadNotifications } = useDashboard();
    const userRole = profile?.is_admin ? "admin" : "member"; // Simplified for now
    const userEmail = profile?.email;

    const handleSignOut = () => {
        supabase.auth.signOut();
        router.push("/login");
    };

    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "wallet", label: "My Wallet", icon: Wallet },
        { id: "explore", label: "Explore Loans", icon: PiggyBank },
        { id: "loans", label: "Borrow (My Loans)", icon: Wallet },
        { id: "notifications", label: "Notifications", icon: Bell, count: unreadNotifications },
        { id: "transactions", label: "Transactions", icon: FileText },
        ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: Activity }] : []),
        { id: "kyc", label: "Identity Verification", icon: ShieldCheck },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const handleNav = (id: string) => {
        router.push(`/dashboard/${id}`);
        if (window.innerWidth < 1024 && onClose) {
            onClose();
        }
        if (!isExpanded && onToggleExpand) {
            onToggleExpand();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={false}
                animate={{ 
                    width: isExpanded ? 256 : 80,
                    x: (typeof window !== 'undefined' && window.innerWidth < 1024 && !isOpen) ? -280 : 0
                }}
                transition={{ type: "tween", ease: "circOut", duration: 0.25 }}
                className={cn(
                    "bg-slate-950 h-screen flex flex-col fixed left-0 top-0 border-r border-white/5 shadow-[20px_0_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden",
                    isOpen ? "translate-x-0" : "lg:translate-x-0"
                )}
            >
                {/* Dark Sunset Accents - Restored */}
                <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-rose-600/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[20%] right-[-20%] w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] -z-10" />

                {/* Top Logo & Toggle Section */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between min-h-[80px] bg-white/[0.02]">
                    <div className={cn("flex items-center gap-3", !isExpanded && "mx-auto")}>
                        <motion.div 
                            onClick={() => !isExpanded && onToggleExpand?.()}
                            className={cn(
                                "rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex-shrink-0",
                                isExpanded ? "h-10 w-10" : "h-12 w-12 cursor-pointer hover:scale-105"
                            )}
                        >
                            <span className="font-bold text-xl uppercase italic">P</span>
                        </motion.div>
                        
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    <h1 className="text-sm font-black text-white tracking-widest uppercase leading-none">PeerLend</h1>
                                    <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">Smart Capital</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {isExpanded && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleExpand}
                            className="hidden lg:flex text-slate-500 hover:text-white hover:bg-white/5 rounded-lg h-8 w-8"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                    )}
                    
                    {isOpen && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="lg:hidden text-slate-500 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Navigation Toggle (Collapsed state only) */}
                {!isExpanded && (
                    <div className="flex justify-center py-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleExpand}
                            className="hidden lg:flex text-slate-500 hover:text-white hover:bg-white/5 rounded-lg h-9 w-9 border border-white/5 lg:mb-2"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <nav className="flex-1 px-3 space-y-1.5 py-6 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={`/dashboard/${item.id}`}
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    if (window.innerWidth < 1024 && onClose) onClose();
                                    if (!isExpanded && onToggleExpand) onToggleExpand();
                                }}
                                title={!isExpanded ? item.label : ""}
                                className={cn(
                                    "w-full flex items-center transition-all duration-300 group relative overflow-hidden",
                                    isExpanded ? "px-4 py-3 rounded-xl gap-3" : "py-4 justify-center rounded-2xl",
                                    isActive
                                        ? "bg-white/10 text-white shadow-inner border border-white/10"
                                        : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 opacity-100"
                                    />
                                )}
                                <item.icon className={cn(
                                    "transition-transform duration-300 relative z-10",
                                    isExpanded ? "h-5 w-5" : "h-6 w-6",
                                    isActive ? "text-orange-400 scale-110" : "text-slate-600 group-hover:text-orange-400 group-hover:scale-110"
                                )} />
                                
                                {isExpanded && (
                                    <span className="font-bold text-[13px] tracking-tight relative z-10">{item.label}</span>
                                )}

                                {item.count && item.count > 0 && (
                                    <span className={cn(
                                        "bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center z-10",
                                        isExpanded ? "px-1.5 py-0.5 ml-auto shadow-lg shadow-rose-500/40" : "absolute top-2 right-2 h-4 w-4 border-2 border-slate-950"
                                    )}>
                                        {item.count}
                                    </span>
                                )}

                                {isActive && (
                                    <motion.div
                                        className={cn(
                                            "absolute left-0 bg-gradient-to-b from-orange-500 to-rose-600 rounded-r-full shadow-[0_0_15px_rgba(244,63,94,0.6)] z-20",
                                            isExpanded ? "w-1 h-6" : "w-1 h-8"
                                        )}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile / Collapsed Actions */}
                <div className={cn(
                    "p-4 border-t border-white/5 bg-white/[0.02] backdrop-blur-3xl",
                    !isExpanded && "flex flex-col items-center gap-4"
                )}>
                    {isExpanded ? (
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-xs border border-white/10">
                                {userEmail ? userEmail[0].toUpperCase() : "U"}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-[12px] font-bold text-white truncate">{userEmail || "User"}</p>
                                <p className="text-[9px] text-rose-500 uppercase font-black tracking-widest">{isAdmin ? "Admin" : userRole}</p>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => !isExpanded && onToggleExpand?.()}
                            className={cn(
                                "h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm border border-white/10 transition-transform",
                                !isExpanded && "cursor-pointer hover:scale-105"
                            )}
                        >
                            {userEmail ? userEmail[0].toUpperCase() : "U"}
                        </div>
                    )}
                    
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className={cn(
                            "text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors",
                            isExpanded ? "w-full justify-start gap-2 h-10 px-3 text-[11px] font-bold uppercase" : "h-10 w-10 p-0 rounded-xl"
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        {isExpanded && <span className="font-black">Sign Out</span>}
                    </Button>
                </div>
            </motion.div>
        </>
    );
}
