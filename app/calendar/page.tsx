"use client";

import { PaymentCalendar } from "@/components/payment-calendar";
import { mockSubscriptions } from "@/lib/mock-data";

export default function CalendarPage() {
  return (
    <main className="container mx-auto p-6">
      <PaymentCalendar subscriptions={mockSubscriptions} />
    </main>
  );
}
