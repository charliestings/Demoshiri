"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckSquare, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationsView({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (fetchError) {
                console.error("Error fetching notifications (Detailed):", {
                    message: fetchError.message,
                    details: fetchError.details,
                    hint: fetchError.hint,
                    code: fetchError.code
                });

                let errorMsg = "Failed to fetch notifications.";
                if (fetchError.code === '42P01') {
                    errorMsg = "The 'notifications' table does not exist in the database.";
                } else if (fetchError.code === '42501') {
                    errorMsg = "Permission denied. Check Row Level Security (RLS) policies.";
                } else {
                    errorMsg = fetchError.message || errorMsg;
                }

                setError(errorMsg);
            } else {
                setNotifications(data || []);
            }
        } catch (err: any) {
            console.error("Unexpected error in fetchNotifications:", err);
            setError(err.message || "An unexpected error occurred while loading notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchNotifications();
    }, [userId]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        }
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        }
    };

    const handleRedirect = async (notification: any) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        if (notification.link) {
            // Check if it's a dashboard tab link
            if (notification.link.startsWith('/dashboard?tab=')) {
                const params = new URLSearchParams(notification.link.split('?')[1]);
                const tab = params.get('tab');
                if (tab) {
                    // We can't easily trigger setActiveTab here without prop drilling,
                    // but since common usage is Link or window.location, 
                    // we'll use router.push which handles the URL update and state in page.tsx
                }
            }
            // Use window.location for now as it's the most reliable way to trigger 
            // the full state update in page.tsx if it's listening to URL params
            window.location.href = notification.link;
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Loading notifications...</div>;
    }

    if (error) {
        return (
            <div className="p-10 text-center space-y-4">
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl max-w-md mx-auto">
                    <h3 className="text-rose-600 font-black mb-2 uppercase tracking-widest text-xs">Error Loading Notifications</h3>
                    <p className="text-slate-600 text-sm mb-4">{error}</p>
                    <p className="text-slate-500 text-[10px] font-medium italic">
                        Tip: Did you run the SQL script `supabase/create_notifications_table.sql` in your Supabase dashboard?
                    </p>
                </div>
                <Button onClick={fetchNotifications} variant="outline" className="rounded-xl">
                    Try Again
                </Button>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Notifications</h2>
                    <p className="text-slate-500 font-medium">Stay updated with your account activity.</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={markAllAsRead}
                        variant="outline"
                        className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest"
                    >
                        <CheckSquare className="mr-2 h-4 w-4" /> Mark all as read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="border-slate-100 shadow-sm">
                    <CardContent className="py-20 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No notifications yet</h3>
                        <p className="text-slate-500 mt-2">We'll let you know when something important happens.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`relative group p-6 rounded-2xl border transition-all duration-300 ${notification.is_read
                                    ? "bg-white/50 border-slate-100"
                                    : "bg-white border-orange-100 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/10"
                                    }`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                {!notification.is_read && (
                                    <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                                        <div className="h-2 w-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
                                        <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-bounce">New</span>
                                    </div>
                                )}
                                <div className="flex gap-6 items-start">
                                    <div className={`mt-1 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'loan_request' ? 'bg-blue-50 text-blue-600' :
                                        notification.type === 'loan_status_change' ? 'bg-orange-50 text-orange-600' :
                                            'bg-slate-50 text-slate-600'
                                        }`}>
                                        <Bell className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-lg font-black ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <p className={`text-sm font-medium mb-4 ${notification.is_read ? 'text-slate-500' : 'text-slate-600'}`}>
                                            {notification.message}
                                        </p>
                                        {notification.link && (
                                            <Button
                                                variant="link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRedirect(notification);
                                                }}
                                                className="p-0 h-auto inline-flex items-center gap-1 text-xs font-black text-rose-600 uppercase tracking-widest hover:gap-2 transition-all hover:no-underline"
                                            >
                                                View Details <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
