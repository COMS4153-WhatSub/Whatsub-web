export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  serviceType: "streaming" | "music" | "software" | "gaming" | "other";
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly";
  nextBillingDate: string;
  status: "active" | "cancelled" | "paused";
  autoRenew: boolean;
  startDate: string;
  description?: string;
  icon?: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingPayments: number;
}
