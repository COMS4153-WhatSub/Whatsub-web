import { Subscription, SubscriptionStats } from "./types";

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub-1",
    userId: "user-1",
    serviceName: "Netflix",
    serviceType: "streaming",
    price: 15.99,
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: "2025-11-20T00:00:00Z",
    status: "active",
    autoRenew: true,
    startDate: "2024-01-15T00:00:00Z",
    description: "Premium plan",
    icon: "🎬",
  },
  {
    id: "sub-2",
    userId: "user-1",
    serviceName: "Spotify",
    serviceType: "music",
    price: 9.99,
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: "2025-11-25T00:00:00Z",
    status: "active",
    autoRenew: true,
    startDate: "2024-03-10T00:00:00Z",
    description: "Premium plan",
    icon: "🎵",
  },
];

export const mockStats: SubscriptionStats = {
  totalSubscriptions: 2,
  activeSubscriptions: 2,
  monthlyTotal: 25.98,
  yearlyTotal: 311.76,
  upcomingPayments: 2,
};
