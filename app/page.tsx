"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { getSubscriptions, calculateStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription, SubscriptionStats } from "@/lib/types";

export default function Home() {
  const { isAuthenticated, userId, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If not authenticated, redirect to login immediately
    if (!isAuthenticated || !userId) {
      if (!redirecting) {
        setRedirecting(true);
        router.push("/login");
      }
        return;
    }

    // If authenticated, load data
    async function loadData() {
        if (!userId) return;
      setLoading(true);
        try {
            const data = await getSubscriptions(userId);
            setSubs(data);
            setStats(calculateStats(data));
        } catch (e) {
            console.error(e);
        // If error is auth-related, redirect will be handled by API
        } finally {
            setLoading(false);
        }
    }

        loadData();
  }, [isAuthenticated, userId, router, authLoading, redirecting]);

  // Show nothing while auth is loading or redirecting
  if (authLoading || redirecting || !isAuthenticated || !userId) {
      return null; 
  }

  // Show loading skeleton while data is loading
  if (loading) {
      return (
      <main className="container mx-auto p-6">
        <DashboardSkeleton />
      </main>
    );
  }

  // Show dashboard only when authenticated and data is loaded
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

  // Only render dashboard if we have stats and userId
  if (!stats || !userId) {
    return null;
  }

  return (
    <main className="container mx-auto p-6">
      <Dashboard
        subscriptions={subs}
        stats={stats}
        userId={userId}
        onRefresh={handleRefresh}
      />
    </main>
  );
}
