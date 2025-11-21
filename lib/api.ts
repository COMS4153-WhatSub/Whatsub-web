import { Subscription, SubscriptionStats } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function adaptSubscription(data: any): Subscription {
  // Map backend 'annually' to frontend 'yearly'
  let cycle: "monthly" | "yearly" | "quarterly" = "monthly";
  if (data.billing_type === "annually") cycle = "yearly";
  else if (data.billing_type === "quarterly") cycle = "quarterly";

  return {
    id: String(data.id),
    userId: data.user_id,
    serviceName: data.plan,
    serviceType: "other", // We don't have this info yet
    price: Number(data.price),
    currency: "USD",
    billingCycle: cycle,
    nextBillingDate: data.billing_date,
    status: "active", // Default
    autoRenew: true, // Default
    startDate: data.created_at,
    description: data.account,
    url: data.url,
    account: data.account,
  };
}

function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem("whatsub_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  if (!userId) return [];
  
  try {
    // Call Composite: GET /users/{id}/subscriptions
    // This endpoint is protected by JWT
    const res = await fetch(`${API_BASE_URL}/users/${userId}/subscriptions?limit=100`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            console.warn("Unauthorized access to subscriptions");
            // Token might be expired, handled by UI redirection
        }
        return [];
    }
    
    const json = await res.json();
    // Composite might return { items: [], total: ... } or direct list?
    // Checking Composite service code: `return await subscription_client.list_subscriptions(...)`
    // Subscription service returns PaginatedResponse { items: ... }
    return (json.items || []).map(adaptSubscription);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

export function calculateStats(subs: Subscription[]): SubscriptionStats {
  const now = new Date();
  
  const monthlyTotal = subs.reduce((acc, sub) => {
    if (sub.billingCycle === "monthly") return acc + sub.price;
    if (sub.billingCycle === "quarterly") return acc + sub.price / 3;
    if (sub.billingCycle === "yearly") return acc + sub.price / 12;
    return acc;
  }, 0);

  const yearlyTotal = subs.reduce((acc, sub) => {
    if (sub.billingCycle === "monthly") return acc + sub.price * 12;
    if (sub.billingCycle === "quarterly") return acc + sub.price * 4;
    if (sub.billingCycle === "yearly") return acc + sub.price;
    return acc;
  }, 0);
  
  // Simple upcoming logic: billing date is in future
  const upcoming = subs.filter(sub => new Date(sub.nextBillingDate) > now).length;

  return {
    totalSubscriptions: subs.length,
    activeSubscriptions: subs.filter(s => s.status === "active").length,
    monthlyTotal,
    yearlyTotal,
    upcomingPayments: upcoming
  };
}

export interface CreateSubscriptionPayload {
  user_id: string;
  plan: string;
  billing_type: "monthly" | "quarterly" | "annually";
  url?: string;
  account?: string;
  billing_date?: string;
  price?: string;
}

export interface UpdateSubscriptionPayload {
  plan?: string;
  billing_type?: "monthly" | "quarterly" | "annually";
  url?: string;
  account?: string;
  billing_date?: string;
  price?: string;
}

export async function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Failed to create subscription" }));
      throw new Error(error.detail || "Failed to create subscription");
    }

    const data = await res.json();
    return adaptSubscription(data);
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function updateSubscription(
  subscriptionId: string,
  payload: UpdateSubscriptionPayload
): Promise<Subscription> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Failed to update subscription" }));
      throw new Error(error.detail || "Failed to update subscription");
    }

    const data = await res.json();
    return adaptSubscription(data);
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Failed to delete subscription" }));
      throw new Error(error.detail || "Failed to delete subscription");
    }
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}
