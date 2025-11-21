"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentCalendar } from "@/components/payment-calendar";
import { getSubscriptions } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Subscription } from "@/lib/types";

export default function CalendarPage() {
  const { isAuthenticated, userId } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        } finally {
            setLoading(false);
        }
    }

    if (userId) {
        loadData();
    }
  }, [userId, router]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <main className="container mx-auto p-6">
      <PaymentCalendar subscriptions={subs} />
    </main>
  );
}
