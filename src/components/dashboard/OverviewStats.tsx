import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from "lucide-react";

interface OverviewStatsProps {
    mode: "borrower" | "lender";
}

export function OverviewStats({ mode }: OverviewStatsProps) {
    const stats = mode === "borrower"
        ? [
            { label: "Total Borrowed", value: "$12,450", change: "+5%", icon: Wallet, trend: "up" },
            { label: "Next Payment", value: "$450", change: "Due in 3 days", icon: Activity, trend: "neutral" },
            { label: "Credit Score", value: "780", change: "+12 pts", icon: ArrowUpRight, trend: "up" },
        ]
        : [
            { label: "Total Invested", value: "$45,200", change: "+12%", icon: Wallet, trend: "up" },
            { label: "Net Returns", value: "$5,420", change: "+8.5% APY", icon: ArrowUpRight, trend: "up" },
            { label: "Active Loans", value: "15", change: "2 ending soon", icon: Activity, trend: "neutral" },
        ];

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            {stats.map((stat, i) => (
                <Card key={i} className="glass-card border-white/60 bg-white/70">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-slate-500">
                                {stat.label}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <stat.icon className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</div>
                        <p className="text-sm font-medium text-slate-400 mt-1 flex items-center">
                            {stat.trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />}
                            {stat.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />}
                            {stat.change}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
