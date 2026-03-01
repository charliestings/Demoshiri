"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    sideTitle: React.ReactNode;
    sideSubtitle: string;
    sideDecoration: string;
    backLink?: {
        href: string;
        label: string;
    };
}

export function AuthLayout({
    children,
    title,
    subtitle,
    sideTitle,
    sideSubtitle,
    sideDecoration,
    backLink
}: AuthLayoutProps) {
    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="flex bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 min-h-[600px] relative w-full">
                {/* Left Side: Solid Theme Color */}
                <div className="hidden md:flex md:w-[320px] shrink-0 bg-gradient-to-br from-orange-500 to-rose-600 p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16" />

                    <div className="relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-10 border border-white/20">
                            <span className="font-bold text-2xl text-white italic">P</span>
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">
                            {sideTitle}
                        </h2>
                        <p className="text-white/80 mt-6 text-sm font-medium leading-relaxed">
                            {sideSubtitle}
                        </p>
                    </div>

                    <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 rotate-90 text-white/10 font-black text-7xl tracking-[0.2em] pointer-events-none uppercase whitespace-nowrap">
                        {sideDecoration}
                    </div>
                </div>

                {/* Right Side: Form Content */}
                <div className="flex-1 p-8 md:p-14 bg-white/50 backdrop-blur-xl flex flex-col justify-center relative">
                    {backLink && (
                        <Link
                            href={backLink.href}
                            className="absolute top-8 right-8 inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all group"
                        >
                            <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
                            {backLink.label}
                        </Link>
                    )}

                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-10">
                            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-rose-600 rounded-full mb-4" />
                            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{title}</h1>
                            <p className="text-slate-500 font-medium">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
