"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestLoanModal } from "@/components/dashboard/RequestLoanModal";
import { InvestLoanModal } from "@/components/dashboard/InvestLoanModal"; // Import once
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { NotificationsView } from "@/components/dashboard/NotificationsView";
import { LenderView } from "@/components/dashboard/LenderView";
import { WalletView } from "@/components/dashboard/WalletView";
import { TransactionsView } from "@/components/dashboard/TransactionsView";
import { TransactionSuccessModal } from "@/components/dashboard/TransactionSuccessModal";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
    Filter,
    Loader2,
    ArrowUpRight,
    Search,
    Activity,
    Briefcase,
    Info,
    TrendingUp,
    Zap,
    ShieldCheck,
    Wallet,
    Shield,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { formatINR, formatCompactINR } from "@/lib/formatters";

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<"borrower" | "lender">("borrower");
    const [isAdmin, setIsAdmin] = useState(false);
    const [kycStatus, setKycStatus] = useState<string>("none");
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<any[]>([]);
    const [investments, setInvestments] = useState<any[]>([]);
    const [pendingKYCUsers, setPendingKYCUsers] = useState<any[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [showRepaySuccess, setShowRepaySuccess] = useState(false);
    const [lastRepayAmount, setLastRepayAmount] = useState(0);
    const [lastRepayPurpose, setLastRepayPurpose] = useState("");
    const [showInvestSuccess, setShowInvestSuccess] = useState(false);
    const [lastInvestAmount, setLastInvestAmount] = useState(0);
    const [lastInvestPurpose, setLastInvestPurpose] = useState("");

    const fetchNotificationsCount = useCallback(async () => {
        if (!user) return;
        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) {
            console.error("Error fetching notifications count:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        } else {
            setUnreadNotifications(count || 0);
        }
    }, [user]);

    const fetchData = useCallback(async () => {
        if (!user) return;

        // Fetch all loans to allow switching between views
        const { data: loansData, error: loansError } = await supabase
            .from("loans")
            .select("*, profiles(*)")
            .order("created_at", { ascending: false });

        if (loansError) {
            console.error("Error fetching loans:", loansError.message, loansError.details);
        } else {
            setLoans(loansData || []);
        }

        // Fetch user's investments
        const { data: investData, error: investError } = await supabase
            .from("investments")
            .select("*, loans(*)")
            .eq("investor_id", user.id);

        if (investError) console.error("Error fetching investments:", investError);
        else setInvestments(investData || []);

        // Fetch pending KYC users for admin
        if (isAdmin || user.email?.includes('admin')) {
            const { data: kycData, error: kycError } = await supabase
                .from("profiles")
                .select("*")
                .eq("kyc_status", "pending")
                .order("kyc_submitted_at", { ascending: true });

            if (kycError) console.error("Error fetching KYC data:", kycError);
            else setPendingKYCUsers(kycData || []);
        }

        // Refresh current user's KYC status to keep UI in sync
        const { data: currentProfile, error: profileError } = await supabase
            .from("profiles")
            .select("kyc_status")
            .eq("id", user.id)
            .single();

        if (!profileError && currentProfile) {
            setKycStatus(currentProfile.kyc_status || "none");
        }
    }, [user, isAdmin]);

    const handleLoanStatusUpdate = async (loanId: string, status: string) => {
        // Fetch loan details to get borrower_id and purpose before update
        const { data: loanData } = await supabase
            .from("loans")
            .select("borrower_id, purpose, amount")
            .eq("id", loanId)
            .single();

        const { error } = await supabase
            .from("loans")
            .update({ status })
            .eq("id", loanId);

        if (error) {
            console.error("Error updating loan status:", error);
            alert("Failed to update loan status");
        } else {
            // Create notification for borrower
            if (loanData) {
                try {
                    await supabase.from("notifications").insert({
                        user_id: loanData.borrower_id,
                        title: `Loan ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        message: `Your loan request for ₹${loanData.amount} (${loanData.purpose}) has been ${status}.`,
                        type: "loan_status_change",
                        link: "/dashboard?tab=loans"
                    });
                } catch (notifyError) {
                    console.error("Error creating borrower notification:", notifyError);
                }
            }
            fetchData();
        }
    };

    const handleKYCUpdate = async (userId: string, status: 'approved' | 'rejected', reason?: string) => {
        const { error } = await supabase.rpc('verify_user_kyc', {
            payload: {
                target_user_id: userId,
                new_status: status,
                rejection_reason: reason || null
            }
        });

        if (error) {
            console.error("Error updating KYC status (Full Object):", JSON.stringify(error, null, 2));
            alert(`Failed to update KYC status: ${error.message || 'Unknown error'} (Code: ${error.code || 'N/A'})`);
        } else {
            // Create notification for user
            try {
                await supabase.from("notifications").insert({
                    user_id: userId,
                    title: `KYC Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                    message: status === 'approved'
                        ? 'Congratulations! Your identity verification is complete. You now have full platform access.'
                        : `Your identity verification was rejected. Reason: ${reason}. Please re-submit clear documents.`,
                    type: "kyc_status_change",
                    link: "/dashboard?tab=settings"
                });
            } catch (notifyError) {
                console.error("Error creating KYC notification:", notifyError);
            }
            fetchData();
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login?redirect=dashboard");
                return;
            }
            setUser(session.user);

            // Fetch profile to get role and admin status
            let { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, full_name, is_admin, kyc_status")
                .eq("id", session.user.id)
                .single();

            // If profile doesn't exist, create a default one
            if (profileError && profileError.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await supabase
                    .from("profiles")
                    .insert({
                        id: session.user.id,
                        is_admin: session.user.email?.includes('admin'),
                        full_name: session.user.email?.split('@')[0] || 'User'
                    })
                    .select()
                    .single();

                if (!createError) profile = newProfile;
                else console.error("Error creating profile:", createError);
            }

            if (profile) {
                // Since 'role' doesn't exist in the DB, we default to borrower or infer from is_admin
                setRole("borrower");
                setIsAdmin(profile.is_admin || false);
                setKycStatus(profile.kyc_status || "none");
            }

            setLoading(false);
        };
        checkUser();
    }, [router]);

    // Handle tab switching via URL search params
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["overview", "market", "loans", "transactions", "admin", "settings", "notifications", "wallet"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData();
        fetchNotificationsCount();
    }, [fetchData, fetchNotificationsCount]);

    if (loading) {
        return (
            <div className="min-h-screen bg-rose-50/20 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
                    </div>
                </div>
                <p className="text-sm font-black text-rose-600 uppercase tracking-widest animate-pulse">Syncing Capital...</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#fffcfc] selection:bg-rose-100 selection:text-rose-900">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userRole={role}
                isAdmin={isAdmin}
                userEmail={user?.email}
                unreadNotifications={unreadNotifications}
            />

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-hidden h-screen relative bg-[#fffcfc]">
                {/* Floating Sunset Blobs - Matches Homepage */}
                <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] -z-10 animate-pulse" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-rose-200/30 rounded-full blur-[100px] -z-10" />

                <header className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight neon-text uppercase leading-none">
                            {activeTab === "market" ? "Explore Loans" : activeTab.replace("-", " ")}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Hello, {user?.email?.split('@')[0] || 'User'}. Managing your {role} portfolio.</p>
                    </div>
                    {/* Global actions */}
                    <div className="flex items-center gap-4">
                        <RequestLoanModal userId={user.id} onLoanCreated={fetchData} kycStatus={kycStatus} />
                    </div>
                </header>

                {/* KYC Warning Banner */}
                {kycStatus !== 'approved' && !isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between relative z-10 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-orange-900 uppercase tracking-widest">Verification Required</p>
                                <p className="text-[10px] text-orange-700 font-medium mt-0.5">
                                    {kycStatus === 'pending'
                                        ? "Your identity verification is being reviewed. Financial features will unlock once approved."
                                        : "Complete your KYC verification in Settings to start borrowing or investing capital."}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setActiveTab("settings")}
                            variant="ghost"
                            className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-100 rounded-xl px-4"
                        >
                            {kycStatus === 'pending' ? "Check Status" : "Verify Now"}
                        </Button>
                    </motion.div>
                )}

                <div className="relative z-10 overflow-y-auto h-[calc(100vh-160px)] pr-2 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* VIEW LOGIC */}
                            {activeTab === "overview" && (
                                <div className="space-y-8">
                                    <OverviewStats
                                        mode={isAdmin ? 'lender' : role}
                                        loans={loans}
                                        investments={investments}
                                        kycStatus={kycStatus}
                                    />

                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
                                        {/* Reuse Views for simple list, limit 2 */}
                                        {role === "borrower" && !isAdmin ? (
                                            <BorrowerView
                                                loans={loans.filter(l => l.borrower_id === user.id).slice(0, 2)}
                                                userId={user.id}
                                                onLoanCreated={fetchData}
                                                kycStatus={kycStatus}
                                                onShowWallet={() => setActiveTab("wallet")}
                                                onShowRepaySuccess={(amt, purpose) => {
                                                    setLastRepayAmount(amt);
                                                    setLastRepayPurpose(purpose);
                                                    setShowRepaySuccess(true);
                                                }}
                                            />
                                        ) : isAdmin ? (
                                            <AdminView
                                                loans={loans.filter(l => l.status === 'pending').slice(0, 3)}
                                                kycUsers={pendingKYCUsers.slice(0, 3)}
                                                onUpdate={handleLoanStatusUpdate}
                                                onKYCUpdate={handleKYCUpdate}
                                            />
                                        ) : (
                                            <LenderView loans={loans.filter(l => l.status === 'approved' && l.borrower_id !== user.id).slice(0, 3)} userId={user.id} onInvested={fetchData} kycStatus={kycStatus} onShowWallet={() => setActiveTab("wallet")} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "loans" && (
                                <BorrowerView
                                    loans={loans.filter(l => l.borrower_id === user.id)}
                                    userId={user.id}
                                    onLoanCreated={fetchData}
                                    kycStatus={kycStatus}
                                    onShowWallet={() => setActiveTab("wallet")}
                                    onShowRepaySuccess={(amt, purpose) => {
                                        setLastRepayAmount(amt);
                                        setLastRepayPurpose(purpose);
                                        setShowRepaySuccess(true);
                                    }}
                                />
                            )}

                            {activeTab === "wallet" && (
                                <WalletView userId={user.id} />
                            )}

                            {activeTab === "market" && (
                                <LenderView
                                    loans={loans.filter(l => l.status === 'approved' && l.borrower_id !== user.id)}
                                    userId={user.id}
                                    onInvested={fetchData}
                                    kycStatus={kycStatus}
                                    onShowWallet={() => setActiveTab("wallet")}
                                    onShowSuccess={(amt, purpose) => {
                                        setLastInvestAmount(amt);
                                        setLastInvestPurpose(purpose);
                                        setShowInvestSuccess(true);
                                    }}
                                />
                            )}

                            {activeTab === "admin" && isAdmin && (
                                <AdminView
                                    loans={loans}
                                    kycUsers={pendingKYCUsers}
                                    onUpdate={handleLoanStatusUpdate}
                                    onKYCUpdate={handleKYCUpdate}
                                />
                            )}

                            {activeTab === "settings" && (
                                <SettingsView user={user} onUpdate={fetchData} />
                            )}

                            {activeTab === "notifications" && user && (
                                <NotificationsView userId={user.id} />
                            )}

                            {activeTab === "transactions" && user && (
                                <TransactionsView userId={user.id} />
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <TransactionSuccessModal
                isOpen={showRepaySuccess}
                onClose={() => setShowRepaySuccess(false)}
                title="Loan Repaid!"
                amount={lastRepayAmount}
                description={`You have successfully repaid your loan for "${lastRepayPurpose}".`}
                onViewWallet={() => setActiveTab("wallet")}
            />

            <TransactionSuccessModal
                isOpen={showInvestSuccess}
                onClose={() => setShowInvestSuccess(false)}
                title="Investment Successful!"
                amount={lastInvestAmount}
                description={`Your investment in "${lastInvestPurpose}" has been processed.`}
                onViewWallet={() => setActiveTab("wallet")}
            />
        </div>
    );
}

function BorrowerProfileModal({ profile, loan, onApprove, onReject }: { profile: any, loan: any, onApprove: () => void, onReject: () => void }) {
    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && profile?.id) {
            const fetchBorrowerStats = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from("loans")
                    .select("amount, status")
                    .eq("borrower_id", profile.id);

                if (!error && data) {
                    const totalRequests = data.length;
                    const approvedLoans = data.filter(l => l.status === 'approved' || l.status === 'funded');
                    const totalBorrowed = approvedLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
                    const successRate = totalRequests > 0 ? (approvedLoans.length / totalRequests) * 100 : 0;

                    setStats({
                        totalRequests,
                        totalBorrowed,
                        successRate: Math.round(successRate),
                        memberSince: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'
                    });
                }
                setLoading(false);
            };
            fetchBorrowerStats();
        }
    }, [open, profile?.id, profile.created_at]);

    // Real Data from Profile
    const aiScore = profile?.kyc_match_score || 0;
    const isLivenessVerified = profile?.kyc_liveness_verified || false;
    const kycStatus = profile?.kyc_status || 'none';
    const aiNotes = profile?.kyc_documents?.ai_notes || "No diagnostic notes available.";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl">
                    Analyze Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl !bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <div className="p-8 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Borrower Analysis</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Real-time AI verification for {profile?.full_name || 'User'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100 shadow-sm">
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">AI Trust Score</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-slate-900">{aiScore}%</p>
                                    <p className="text-[10px] font-bold text-slate-400">Match Accuracy</p>
                                </div>
                                <div className="w-full bg-orange-200/50 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${aiScore >= 80 ? 'bg-emerald-500' : aiScore >= 50 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${aiScore}%` }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Success Rate</p>
                                    <p className="text-base font-black text-emerald-600">{loading ? '...' : `${stats?.successRate || 0}%`}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Total Loans</p>
                                    <p className="text-base font-black text-slate-900">{loading ? '...' : stats?.totalRequests || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Identity Status</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${kycStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    kycStatus === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {kycStatus === 'approved' ? 'Verified' : kycStatus === 'pending' ? 'Reviewing' : 'No KYC'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Liveness</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLivenessVerified ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isLivenessVerified ? 'Passed' : 'Not Validated'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Borrowed</span>
                                <span className="text-xs font-black text-slate-900">{loading ? '...' : formatINR(stats?.totalBorrowed || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100/80">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Member Since</span>
                                <span className="text-xs font-black text-slate-900">{loading ? '...' : stats?.memberSince || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="px-8 py-4 pb-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Loan Request Details</h4>
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Principal Amount</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{formatINR(loan.amount)}</p>
                            </div>
                            <div className="text-right space-y-2">
                                <div className="flex items-center gap-4 justify-end">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Rate</p>
                                        <p className="text-sm font-black text-rose-600">{loan.interest_rate}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Term</p>
                                        <p className="text-sm font-black text-slate-900">{loan.duration_months} Mo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <Button
                            onClick={() => { onApprove(); setOpen(false); }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                        >
                            Approve Loan
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { onReject(); setOpen(false); }}
                            className="flex-1 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl py-7 font-black uppercase tracking-widest transition-all"
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function KYCReviewModal({ user, onApprove, onReject }: { user: any, onApprove: () => void, onReject: (reason: string) => void }) {
    const [open, setOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
    const [isFetchingUrls, setIsFetchingUrls] = useState(false);

    const docs = user.kyc_documents || {};

    useEffect(() => {
        if (open && Object.keys(docs).length > 0) {
            const fetchSignedUrls = async () => {
                setIsFetchingUrls(true);
                const urls: { [key: string]: string } = {};

                for (const [key, path] of Object.entries(docs)) {
                    if (typeof path !== 'string') continue;

                    // Backward compatibility: If it's already a full URL, use it
                    if (path.startsWith('http')) {
                        urls[key] = path;
                        continue;
                    }

                    // Supabase createSignedUrl needs the full path within the bucket
                    const { data } = await supabase.storage
                        .from('kyc-documents')
                        .createSignedUrl(path, 600); // 10 minutes expiry

                    if (data?.signedUrl) {
                        urls[key] = data.signedUrl;
                    }
                }

                setSignedUrls(urls);
                setIsFetchingUrls(false);
            };

            fetchSignedUrls();
        }
    }, [open, docs]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl">
                    Review Documents
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl !bg-white p-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">KYC Verification: {user.full_name}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Submitted on {new Date(user.kyc_submitted_at).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    {/* Identity Details Section */}
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner flex flex-wrap gap-8 items-center bg-gradient-to-br from-slate-50 to-white">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAN Card Number</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter font-mono">{user.pan_number || 'N/A'}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden md:block" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aadhar Number</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter font-mono">
                                {user.aadhar_number ? `${user.aadhar_number.slice(0, 4)} ${user.aadhar_number.slice(4, 8)} ${user.aadhar_number.slice(8, 12)}` : 'N/A'}
                            </p>
                        </div>
                        <div className="ml-auto">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm transition-all hover:scale-[1.05]">
                                <Shield className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Anti-Scam Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { id: 'id_front', label: 'Gov ID Front', url: signedUrls.id_front },
                            { id: 'id_back', label: 'Gov ID Back', url: signedUrls.id_back },
                            { id: 'pan_card', label: 'PAN Card', url: signedUrls.pan_card },
                            { id: 'selfie', label: 'Selfie with ID', url: signedUrls.selfie },
                        ].map((doc) => (
                            <div key={doc.id} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{doc.label}</Label>
                                    {isFetchingUrls && <Loader2 className="h-3 w-3 animate-spin text-slate-300" />}
                                </div>
                                <div className="relative aspect-video rounded-3xl border border-slate-100 bg-slate-50 overflow-hidden group shadow-sm transition-all hover:shadow-md">
                                    {doc.url ? (
                                        <>
                                            <img src={doc.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-[8px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest pointer-events-none border border-white/10 shadow-lg">
                                                Encrypted Access
                                            </div>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-[2px]"
                                            >
                                                Open High-Res
                                            </a>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                                            {isFetchingUrls ? (
                                                <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                                            ) : (
                                                <div className="p-4 rounded-full bg-slate-100/50">
                                                    <Info className="h-8 w-8 opacity-20" />
                                                </div>
                                            )}
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No Image Data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                            <Shield className="h-4 w-4 text-orange-500" /> AI Verification Engine Insights
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm transition-transform hover:scale-[1.02]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Biometric Match</p>
                                <div className="flex items-end gap-3">
                                    <span className={`text-4xl font-black tracking-tighter ${user.kyc_match_score >= 80 ? 'text-emerald-600' : user.kyc_match_score >= 50 ? 'text-orange-600' : 'text-rose-600'}`}>
                                        {user.kyc_match_score || 0}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Confidence</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${user.kyc_match_score >= 80 ? 'bg-emerald-500' : user.kyc_match_score >= 50 ? 'bg-orange-500' : 'bg-rose-500'}`} style={{ width: `${user.kyc_match_score || 0}%` }} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.02]">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Liveness Proof</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xl font-black uppercase tracking-tight ${user.kyc_liveness_verified ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {user.kyc_liveness_verified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </div>
                                </div>
                                {user.kyc_liveness_verified ? (
                                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-inner">
                                        <Info className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    {showRejectInput ? (
                        <div className="space-y-6 bg-rose-50/50 p-8 rounded-3xl border border-rose-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-rose-900/60">Reason for Rejection</Label>
                                <textarea
                                    className="w-full rounded-2xl border border-rose-200 bg-white p-4 text-sm focus:ring-4 focus:ring-rose-500/10 outline-none h-32 transition-all shadow-inner"
                                    placeholder="Explain why the documents were rejected (e.g. Blurry image, PAN name doesn't match...)"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => onReject(rejectionReason)}
                                    disabled={!rejectionReason}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest rounded-2xl py-7 shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
                                >
                                    Confirm Rejection
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectInput(false)}
                                    className="flex-1 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white rounded-2xl py-7 font-black uppercase tracking-widest border-2"
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-6">
                            <Button
                                onClick={() => { onApprove(); setOpen(false); }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-7 font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                            >
                                Approve Verification
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectInput(true)}
                                className="flex-1 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-2xl py-7 font-black uppercase tracking-widest transition-all"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AdminView({ loans, kycUsers, onUpdate, onKYCUpdate }: {
    loans: any[],
    kycUsers: any[],
    onUpdate: (id: string, status: string) => void,
    onKYCUpdate: (id: string, status: 'approved' | 'rejected', reason?: string) => void
}) {
    const [subTab, setSubTab] = useState<'loans' | 'kyc'>('loans');
    const pendingLoans = loans.filter(l => l.status === 'pending');
    const processedLoans = loans.filter(l => l.status !== 'pending');

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-100 w-fit">
                <button
                    onClick={() => setSubTab('loans')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'loans' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    Loans {pendingLoans.length > 0 && <span className="ml-1 text-rose-500">({pendingLoans.length})</span>}
                </button>
                <button
                    onClick={() => setSubTab('kyc')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'kyc' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                >
                    KYC {kycUsers.length > 0 && <span className="ml-1 text-orange-500">({kycUsers.length})</span>}
                </button>
            </div>

            {subTab === 'loans' ? (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            Pending Approvals
                            <span className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">{pendingLoans.length}</span>
                        </h2>

                        {pendingLoans.length === 0 ? (
                            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                                <CardContent className="py-12 text-center">
                                    <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All clear! No pending requests.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {pendingLoans.map((loan) => (
                                    <Card key={loan.id} className="glass-card bg-white overflow-hidden group hover:shadow-2xl transition-all border-slate-100">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                <div className="flex-1 p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                            <span className="font-black">{loan.profiles?.full_name?.charAt(0) || "U"}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-lg font-black text-slate-900 leading-tight">{loan.purpose}</h3>
                                                                {loan.profiles?.kyc_status === 'approved' && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100" title="Identity Verified">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        <span className="text-[8px] font-black uppercase">Verified</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-slate-500 font-medium">{loan.profiles?.email || "No email"}</p>
                                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                                <BorrowerProfileModal
                                                                    profile={loan.profiles}
                                                                    loan={loan}
                                                                    onApprove={() => onUpdate(loan.id, 'approved')}
                                                                    onReject={() => onUpdate(loan.id, 'rejected')}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-8">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                                            <p className="text-xl font-black text-slate-900">{formatINR(loan.amount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                                                            <p className="text-xl font-black text-rose-600">{loan.interest_rate}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Term</p>
                                                            <p className="text-xl font-black text-slate-900">{loan.duration_months} Mo</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-6 flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100">
                                                    <Button
                                                        onClick={() => onUpdate(loan.id, 'approved')}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => onUpdate(loan.id, 'rejected')}
                                                        className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {processedLoans.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-700 mb-4 uppercase tracking-widest text-[10px]">Processing History</h2>
                            <div className="space-y-3">
                                {processedLoans.slice(0, 5).map((loan) => (
                                    <div key={loan.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-2 w-2 rounded-full ${loan.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="text-sm font-bold text-slate-800">{loan.purpose}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-black text-slate-900">{formatINR(loan.amount)}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        Pending KYC Verifications
                        <span className="text-sm font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{kycUsers.length}</span>
                    </h2>

                    {kycUsers.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                            <CardContent className="py-12 text-center">
                                <Shield className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All clear! No pending KYC submissions.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {kycUsers.map((user) => (
                                <Card key={user.id} className="glass-card bg-white overflow-hidden group hover:shadow-2xl transition-all border-slate-100">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="flex-1 p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                                                        <span className="text-lg font-black">{user.full_name?.charAt(0) || "U"}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-900 leading-tight">{user.full_name}</h3>
                                                        <p className="text-xs text-slate-500 font-medium mt-1">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-8 mt-6">
                                                    {[
                                                        { label: 'City', val: user.city || 'N/A' },
                                                        { label: 'PAN', val: user.pan_number || 'N/A' },
                                                        { label: 'AI Similarity', val: user.kyc_match_score ? `${user.kyc_match_score}%` : '0%' },
                                                        { label: 'Monthly Income', val: formatINR(user.monthly_income || 0) },
                                                    ].map((s, i) => (
                                                        <div key={i}>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                                            <p className="text-sm font-black text-slate-700">{s.val}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-6 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 min-w-[200px]">
                                                <KYCReviewModal
                                                    user={user}
                                                    onApprove={() => onKYCUpdate(user.id, 'approved')}
                                                    onReject={(reason) => onKYCUpdate(user.id, 'rejected', reason)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BorrowerView({ loans, userId, onLoanCreated, kycStatus, onShowWallet, onShowRepaySuccess }: {
    loans: any[],
    userId: string,
    onLoanCreated: () => void,
    kycStatus: string,
    onShowWallet?: () => void,
    onShowRepaySuccess: (amount: number, purpose: string) => void
}) {
    const totalBorrowed = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const pendingLoansCount = loans.filter(l => l.status === 'pending').length;
    const approvedLoansCount = loans.filter(l => l.status === 'approved').length;

    return (
        <div className="space-y-8 relative z-10">
            {/* Borrow Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-orange-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Borrowed</p>
                                <h3 className="text-2xl font-black text-slate-900">{formatINR(totalBorrowed)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-rose-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Requests</p>
                                <h3 className="text-2xl font-black text-slate-900">{pendingLoansCount + approvedLoansCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-amber-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Profile</p>
                                <h3 className="text-2xl font-black text-slate-900">Excellent</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    My Financing Requests
                    <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{loans.length}</span>
                </h2>

                {loans.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-rose-200">
                        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wallet className="h-10 w-10 text-rose-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No active loans</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">Ready to grow? Request your first loan to get started today.</p>
                        <div className="mt-8">
                            <RequestLoanModal
                                userId={userId}
                                onLoanCreated={onLoanCreated}
                                kycStatus={kycStatus}
                                trigger={
                                    <Button className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 shadow-lg shadow-rose-500/20 text-white border-0">
                                        Apply Now
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                        {loans.map((loan) => {
                            const repaymentAmount = loan.amount + (loan.amount * (loan.interest_rate / 100));
                            return (
                                <Card key={loan.id} className="glass-card border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
                                    <div className={`h-1.5 w-full ${loan.status === 'funded' ? 'bg-emerald-500' :
                                        loan.status === 'pending' ? 'bg-slate-300' : 'bg-orange-500'}`} />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 mb-1">{loan.purpose}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{loan.duration_months} Mo</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">{loan.interest_rate}% APR</span>
                                                </div>
                                            </div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${loan.status === 'funded' ? 'bg-emerald-50 text-emerald-600' :
                                                loan.status === 'pending' ? 'bg-slate-50 text-slate-600' :
                                                    loan.status === 'approved' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-rose-50 text-rose-600'
                                                }`}>
                                                {loan.status === 'pending' ? 'Reviewing' : loan.status}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Amount</p>
                                                <div className="text-3xl font-black text-slate-900">{formatINR(loan.amount)}</div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progress</p>
                                                <div className="text-sm font-black text-slate-700">{Math.round(((loan.funded_amount || 0) / loan.amount) * 100)}%</div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            {/* Progress Bar placeholder since Progress component is missing */}
                                            <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((loan.funded_amount || 0) / loan.amount) * 100}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-emerald-500 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {loan.status === 'funded' && (
                                            <div className="pt-4 border-t border-slate-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Repay</p>
                                                        <p className="text-lg font-black text-slate-900">{formatINR(repaymentAmount)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={async () => {
                                                        if (!confirm(`Are you sure you want to repay this loan? Total amount (Principal + Interest): ${formatINR(repaymentAmount)}`)) return;

                                                        try {
                                                            const { data, error: rpcError } = await supabase.rpc('process_loan_repayment', {
                                                                borrower_uid: userId,
                                                                target_loan_id: loan.id
                                                            });

                                                            if (rpcError) {
                                                                console.error("Repayment RPC Error:", JSON.stringify(rpcError, null, 2));
                                                                throw new Error(rpcError.message || "Unknown RPC error");
                                                            }

                                                            if (data && data.success === false) {
                                                                alert(data.error || "Repayment failed");
                                                                return;
                                                            }

                                                            onShowRepaySuccess(repaymentAmount, loan.purpose);
                                                            onLoanCreated();
                                                        } catch (err: any) {
                                                            console.error("Repayment Catch Error:", JSON.stringify(err, null, 2));
                                                            alert("Repayment failed: " + (err.message || "Unknown error"));
                                                        }
                                                    }}
                                                    className="w-full bg-slate-900 border-0 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10"
                                                >
                                                    Repay Loan Now
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Dashboard Tabs updated
// ... in return (activeTab === 'explore') ...
// <LenderView loans={loans} userId={user.id} onInvested={fetchData} kycStatus={kycStatus} onShowWallet={() => setActiveTab('wallet')} />
// ... in return (activeTab === 'loans') ...
// <BorrowerView loans={loans.filter(l => l.borrower_id === user.id)} userId={user.id} onLoanCreated={fetchData} kycStatus={kycStatus} />

