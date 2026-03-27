export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="w-full min-h-screen bg-slate-50/50 pt-20 pb-20 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto px-4">
                {children}
            </div>
        </div>
    )
}
