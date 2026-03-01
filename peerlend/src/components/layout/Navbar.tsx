"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";

export function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const router = useRouter();

    const fetchUnreadCount = async (userId: string) => {
        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (!error) setUnreadNotifications(count || 0);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    fetchUnreadCount(currentUser.id);
                } else {
                    setUnreadNotifications(0);
                }
            }
        );

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchUnreadCount(session.user.id);
            }
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-4" : "py-8"}`}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-8">
                <div className={`flex items-center justify-between transition-all duration-500 ${scrolled
                    ? "bg-white/80 backdrop-blur-2xl border border-white/60 py-3 px-6 rounded-full shadow-2xl shadow-rose-900/5"
                    : "bg-transparent py-2"
                    }`}>
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-all duration-300">
                            <span className="font-bold text-xl uppercase italic">P</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900 font-outfit">PeerLend</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-10">
                        {["Invest", "Borrow", "How it Works"].map((item) => (
                            <Link
                                key={item}
                                href={item === "How it Works" ? "/how-it-works" : `/dashboard?tab=${item.toLowerCase() === 'invest' ? 'market' : 'loans'}`}
                                className="text-slate-500 hover:text-rose-600 transition-all text-sm font-bold uppercase tracking-widest relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-3">
                            {user ? (
                                <>
                                    <Link href="/dashboard?tab=notifications" className="relative p-2 text-slate-600 hover:text-rose-600 transition-colors">
                                        <Bell className="h-6 w-6" />
                                        {unreadNotifications > 0 && (
                                            <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white animate-pulse">
                                                {unreadNotifications}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href="/dashboard">
                                        <Button className="bg-rose-950 text-white hover:bg-rose-900 rounded-full px-6 h-11 font-bold shadow-xl transition-all hover:scale-105">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={handleSignOut}
                                        className="bg-rose-950 text-white hover:bg-rose-900 rounded-full px-6 h-11 font-bold shadow-xl transition-all hover:scale-105"
                                    >
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className="text-slate-900 hover:text-rose-600 hover:bg-rose-50 rounded-full px-6 font-bold">
                                            Log in
                                        </Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button className="bg-gradient-to-r from-orange-600 to-rose-600 text-white hover:opacity-90 shadow-xl shadow-rose-500/30 transition-all rounded-full px-8 h-12 font-bold hover:scale-105">
                                            Get Started
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
                    >
                        <div className="px-6 py-8 space-y-6">
                            {["Invest", "Borrow", "How it Works"].map((item) => (
                                <Link
                                    key={item}
                                    href={item === "How it Works" ? "/how-it-works" : `/dashboard?tab=${item.toLowerCase() === 'invest' ? 'market' : 'loans'}`}
                                    className="block text-xl font-black text-slate-900"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full rounded-2xl h-14 font-bold border-2">Log in</Button>
                                </Link>
                                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full rounded-2xl h-14 font-bold bg-gradient-to-r from-orange-600 to-rose-600 text-white">Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
