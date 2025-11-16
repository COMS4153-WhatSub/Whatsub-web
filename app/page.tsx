"use client";

import { Dashboard } from "@/components/dashboard";
import { mockSubscriptions, mockStats } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="container mx-auto p-6">
      <Dashboard subscriptions={mockSubscriptions} stats={mockStats} />
    </main>
  );
}
