"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCalendar } from "@/components/payment-calendar";
import { CalendarSkeleton } from "@/components/calendar-skeleton";
import { getSubscriptions } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription } from "@/lib/types";

export default function CalendarPage() {
  const { isAuthenticated, userId, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
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
      } catch (e) {
        console.error(e);
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

  // Show skeleton while data is loading
  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <CalendarSkeleton />
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-5xl">
      <PaymentCalendar subscriptions={subs} />
    </main>
  );
}
