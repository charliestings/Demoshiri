"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Package, Truck, Receipt, User } from "lucide-react";

export default function WholesalerDashboard() {
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setName(data?.full_name || "");
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User /> Welcome, {name} (Wholesaler)
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card icon={<Package />} title="Bulk Orders" />
          <Card icon={<Truck />} title="Distribution" />
          <Card icon={<Receipt />} title="Invoices" />
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="p-4 border rounded-lg flex items-center gap-3 hover:shadow">
      <div className="text-purple-600">{icon}</div>
      <p className="font-semibold">{title}</p>
    </div>
  );
}
