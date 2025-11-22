export type SubscriptionCategory = 
  | "streaming" 
  | "music" 
  | "software" 
  | "gaming" 
  | "cloud" 
  | "news" 
  | "fitness" 
  | "education" 
  | "other";

export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  serviceType: "streaming" | "music" | "software" | "gaming" | "other";
  category: SubscriptionCategory;
  price: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "quarterly";
  nextBillingDate: string;
  status: "active" | "cancelled" | "paused";
  autoRenew: boolean;
  startDate: string;
  description?: string;
  icon?: string;
  url?: string;
  account?: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingPayments: number;
}
