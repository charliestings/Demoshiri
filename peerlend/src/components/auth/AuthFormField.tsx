"use client";

import { cn } from "@/lib/utils";

interface AuthFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    rightElement?: React.ReactNode;
}

export function AuthFormField({
    label,
    error,
    rightElement,
    id,
    className,
    ...props
}: AuthFormFieldProps) {
    return (
        <div className="grid gap-2 relative">
            <div className="flex justify-between items-center ml-1">
                <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                    {label}
                </label>
                {rightElement}
            </div>
            <div className="relative">
                <input
                    id={id}
                    className={cn(
                        "w-full bg-slate-100/50 border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-300 transition-all text-slate-900 font-medium",
                        error ? "border-destructive" : "border-slate-200",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs font-bold text-destructive mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
}
