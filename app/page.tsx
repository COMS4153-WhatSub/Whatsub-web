"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getSubscriptions, calculateStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription, SubscriptionStats } from "@/lib/types";

export default function Home() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem("whatsub_token");
    if (!token) {
        router.push("/login");
        return;
    }

    async function loadData() {
        if (!userId) return;
        try {
            const data = await getSubscriptions(userId);
            setSubs(data);
            setStats(calculateStats(data));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (userId) {
        loadData();
    } else if (token) {
        // Token exists but userId missing in context? Wait for hydration or fetch profile?
        // Ideally auth-context handles restoration.
        setLoading(false); 
    }
  }, [isAuthenticated, userId, router]);

  // Prevent flash of content or "Loading" stuck if not auth
  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem("whatsub_token")) {
      return null; 
  }

  if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-lg">Loading...</div>
        </div>
      );
  }

  return (
    <main className="container mx-auto p-6">
      {stats && <Dashboard subscriptions={subs} stats={stats} />}
    </main>
  );
}
