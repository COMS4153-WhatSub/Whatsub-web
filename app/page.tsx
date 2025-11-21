"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
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
        setLoading(true);
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
    }
    // Note: We don't manually set loading(false) if only token exists but no userId yet.
    // We wait for userId to be populated by AuthProvider to trigger loadData.
  }, [isAuthenticated, userId, router]);

  // Prevent flash of content or "Loading" stuck if not auth
  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem("whatsub_token")) {
      return null; 
  }

  if (loading) {
      return (
        <main className="container mx-auto p-6">
            <DashboardSkeleton />
        </main>
      );
  }

  const handleRefresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getSubscriptions(userId);
      setSubs(data);
      setStats(calculateStats(data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-6">
      {stats && userId && (
        <Dashboard
          subscriptions={subs}
          stats={stats}
          userId={userId}
          onRefresh={handleRefresh}
        />
      )}
    </main>
  );
}
