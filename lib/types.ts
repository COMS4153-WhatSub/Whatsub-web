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

export interface Notification {
  id: number;
  subscription_id: number;
  user_id: string;
  notification_type: "email" | "sms" | "push";
  subject: string | null;
  message: string | null;
  status: "queued" | "sent" | "delivered" | "failed";
  read_at: string | null;
  delivered_at: string | null;
  created_at: string;
}
