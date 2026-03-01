import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Wallet, Activity } from "lucide-react";
import { formatCompactINR } from "@/lib/formatters";

interface StatsProps {
    mode: "borrower" | "lender";
    loans?: any[];
    investments?: any[];
    kycStatus?: string;
}

export function OverviewStats({ mode, loans = [], investments = [], kycStatus = "none" }: StatsProps) {
    // Shared Calculations
    const formatPercent = (val: number) => `${Math.round(val)}%`;

    const getBorrowerStats = () => {
        const myLoans = loans.filter(l => l.borrower_id !== undefined); // Simplified for now
        const fundedLoans = loans.filter(l => l.status === 'funded');
        const activeRequests = loans.filter(l => l.status === 'pending' || l.status === 'approved');

        // Calculate real avg interest
        const totalInterest = activeRequests.reduce((acc, l) => acc + (l.interest_rate || 0), 0);
        const avgInterest = activeRequests.length > 0 ? totalInterest / activeRequests.length : 10;

        return [
            {
                label: "Total Borrowed",
                value: fundedLoans.reduce((acc, l) => acc + (l.amount || 0), 0),
                icon: Wallet,
                trend: `${fundedLoans.length} Funded`,
                color: "rose"
            },
            {
                label: "Active Requests",
                value: activeRequests.length,
                icon: Activity,
                trend: "Under Review",
                color: "orange"
            },
            {
                label: "Identity Status",
                value: kycStatus === 'approved' ? "Verified" : kycStatus === 'pending' ? "In Review" : "Unverified",
                icon: Users,
                trend: kycStatus === 'approved' ? "Full Access" : "Limited",
                color: "amber"
            },
            {
                label: "Avg. Interest",
                value: `${avgInterest.toFixed(1)}%`,
                icon: TrendingUp,
                trend: "Current Rate",
                color: "pink"
            },
        ];
    };

    const getLenderStats = () => {
        const totalInvested = investments.reduce((acc, inv) => acc + (inv.amount || 0), 0);
        const fundedCount = investments.filter(inv => inv.loans?.status === 'funded').length;
        const uniqueBorrowers = new Set(investments.map(inv => inv.loans?.borrower_id)).size;

        // Calculate weighted average ROI
        const totalWeightedInterest = investments.reduce((acc, inv) => {
            const rate = inv.loans?.interest_rate || 0;
            return acc + (rate * (inv.amount || 0));
        }, 0);
        const weightedAvgRoi = totalInvested > 0 ? totalWeightedInterest / totalInvested : 10;

        return [
            {
                label: "Total Invested",
                value: totalInvested,
                icon: Wallet,
                trend: `${investments.length} Assets`,
                color: "rose"
            },
            {
                label: "Diversification",
                value: uniqueBorrowers,
                icon: Activity,
                trend: uniqueBorrowers === 1 ? "1 Borrower" : `${uniqueBorrowers} Borrowers`,
                color: "orange"
            },
            {
                label: "Funded Assets",
                value: fundedCount,
                icon: Users,
                trend: investments.length > 0 ? formatPercent((fundedCount / investments.length) * 100) + " Success" : "0% Success",
                color: "amber"
            },
            {
                label: "Portfolio ROI",
                value: `${weightedAvgRoi.toFixed(1)}%`,
                icon: TrendingUp,
                trend: "Weighted Avg",
                color: "pink"
            },
        ];
    };

    const stats = mode === "borrower" ? getBorrowerStats() : getLenderStats();

    const colorConfig: Record<string, string> = {
        rose: "bg-rose-50 text-rose-600",
        orange: "bg-orange-50 text-orange-600",
        amber: "bg-amber-50 text-amber-600",
        pink: "bg-pink-50 text-pink-600"
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <Card key={i} className="glass-card border-none bg-white shadow-xl shadow-rose-200/50 hover:-translate-y-1 transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`h-12 w-12 rounded-2xl ${colorConfig[stat.color]} flex items-center justify-center`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-50 text-slate-400`}>
                                {stat.trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 capitalize mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900">
                                {typeof stat.value === 'number' ? formatCompactINR(stat.value) : stat.value}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
