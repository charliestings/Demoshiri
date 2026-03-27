"use client";

import { useDashboard, DashboardProvider } from "@/context/DashboardContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AlertModal } from "@/components/dashboard/AlertModal";
import { PinVerificationModal } from "@/components/dashboard/PinVerificationModal";
import { TransactionSuccessModal } from "@/components/dashboard/TransactionSuccessModal";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import { RequestLoanModal } from "@/components/dashboard/RequestLoanModal";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { 
        user, isAdmin, kycStatus, fetchData, loading,
        alertConfig, closeAlert,
        isPinModalOpen, setIsPinModalOpen, pinPurpose, pinAction,
        showInvestSuccess, setShowInvestSuccess, lastInvestAmount, lastInvestPurpose,
        showRepaySuccess, setShowRepaySuccess, lastRepayAmount, lastRepayPurpose
    } = useDashboard();
    
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = pathname.split('/').pop() || "overview";
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fffcfc]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#fffcfc] overflow-hidden font-sans">
            <Sidebar 
                activeTab={activeTab} 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                isExpanded={isSidebarExpanded}
                onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
            />

            <motion.main 
                animate={{ 
                    marginLeft: isSidebarExpanded ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 256) : (typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 80)
                }}
                transition={{ type: "tween", ease: "circOut", duration: 0.25 }}
                className={cn(
                    "flex-1 flex flex-col p-4 md:p-8 h-screen overflow-hidden relative bg-[#fffcfc]"
                )}
            >
                {/* Floating Sunset Blobs */}
                <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] -z-10 animate-pulse" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-rose-200/30 rounded-full blur-[100px] -z-10" />

                <header className="flex justify-between items-center mb-4 md:mb-6 relative z-10 gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-slate-600 hover:bg-slate-100 rounded-xl flex-shrink-0"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight neon-text uppercase leading-none">
                                {activeTab === "explore" ? "Explore Loans" : activeTab.replace("-", " ")}
                            </h1>
                            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1 hidden sm:block">Hello, <span className="text-rose-600 font-bold capitalize">{user?.email?.split('@')[0] || 'User'}</span>. Managing your portfolio.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <RequestLoanModal userId={user?.id} onLoanCreated={fetchData} kycStatus={kycStatus} />
                    </div>
                </header>

                {kycStatus !== 'approved' && !isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 md:mb-8 p-3 md:p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-start gap-3 relative z-10 shadow-sm"
                    >
                        <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-orange-900 uppercase tracking-widest">Verification Required</p>
                            <p className="text-[10px] text-orange-700 font-medium mt-0.5">
                                {kycStatus === 'pending'
                                    ? "Your identity verification is being reviewed."
                                    : "Complete KYC in Settings to start borrowing or investing."}
                            </p>
                        </div>
                    </motion.div>
                )}

                <div className="relative z-10 flex-1 overflow-y-auto pr-1 md:pr-2 scrollbar-hide pb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.main>

            <AlertModal
                isOpen={alertConfig.open}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            <PinVerificationModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={async () => {
                    setIsPinModalOpen(false);
                    await pinAction();
                }}
                title={pinPurpose === "investment" ? "Authorize Investment" : "Authorize Repayment"}
                description={`Enter your 6-digit transaction PIN to confirm this ${pinPurpose}.`}
                actionLabel={pinPurpose === "investment" ? "Confirm Investment" : "Confirm Repayment"}
            />

            <TransactionSuccessModal
                isOpen={showRepaySuccess}
                onClose={() => setShowRepaySuccess(false)}
                title="Loan Repaid!"
                amount={lastRepayAmount}
                description={`You have successfully repaid your loan for "${lastRepayPurpose}".`}
                onViewWallet={() => router.push("/dashboard/wallet")}
            />

            <TransactionSuccessModal
                isOpen={showInvestSuccess}
                onClose={() => setShowInvestSuccess(false)}
                title="Investment Successful!"
                amount={lastInvestAmount}
                description={`Your investment in "${lastInvestPurpose}" has been processed.`}
                onViewWallet={() => router.push("/dashboard/wallet")}
            />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>
                {children}
            </DashboardLayoutContent>
        </DashboardProvider>
    );
}
