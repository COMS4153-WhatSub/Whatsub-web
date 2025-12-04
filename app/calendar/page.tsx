"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCalendar } from "@/components/payment-calendar";
import { getSubscriptions } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription } from "@/lib/types";
import { useToast } from "@/lib/toast";

export default function CalendarPage() {
  const { isAuthenticated, userId, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
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
        // If error is auth-related, redirect will be handled by API
        if (e instanceof Error && !e.message.includes("401") && !e.message.includes("403")) {
          toast.showError(e, "Failed to load subscriptions");
        }
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

  // Show loading while data is loading
  if (loading) {
    return (
      <main className="container mx-auto p-6 max-w-5xl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-[600px] bg-muted animate-pulse rounded-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 max-w-5xl">
      <PaymentCalendar subscriptions={subs} />
    </main>
  );
}
