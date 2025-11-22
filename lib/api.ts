import { Subscription, SubscriptionStats, SubscriptionCategory } from "./types";
import { isTokenExpired } from "./jwt-utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Handle authentication errors (401/403) by clearing auth state and redirecting to login.
 * This function can be called from API functions when they receive 401/403 responses.
 */
function handleAuthError() {
  // Clear auth state from localStorage
  localStorage.removeItem("whatsub_token");
  localStorage.removeItem("whatsub_user_id");
  localStorage.removeItem("whatsub_user");
  
  // Trigger page reload to reset auth context state
  // This ensures all components get the updated auth state
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Get emoji icon based on subscription category
 */
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    streaming: "🎬",
    music: "🎵",
    software: "💻",
    gaming: "🎮",
    cloud: "☁️",
    news: "📰",
    fitness: "💪",
    education: "📚",
    other: "📦",
  };
  return iconMap[category] || iconMap.other;
}

function adaptSubscription(data: any): Subscription {
  // Map backend 'annually' to frontend 'yearly'
  let cycle: "monthly" | "yearly" | "quarterly" = "monthly";
  if (data.billing_type === "annually") cycle = "yearly";
  else if (data.billing_type === "quarterly") cycle = "quarterly";

  // Map category from backend, default to "other" if not provided
  const category = data.category || "other";

  return {
    id: String(data.id),
    userId: data.user_id,
    serviceName: data.plan,
    serviceType: "other", // Legacy field, kept for compatibility
    category: category as Subscription["category"],
    price: Number(data.price),
    currency: "USD",
    billingCycle: cycle,
    nextBillingDate: data.billing_date,
    status: "active", // Default
    autoRenew: true, // Default
    startDate: data.created_at,
    description: data.account,
    icon: getCategoryIcon(category),
    url: data.url,
    account: data.account,
  };
}

function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem("whatsub_token");
    
    // Check if token is expired before using it
    if (token && isTokenExpired(token)) {
      console.warn("Token expired, clearing auth state");
      handleAuthError();
      return {};
    }
    
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

/**
 * Get payload signature header if signature verification is enabled.
 * Returns empty object if not enabled or secret not configured.
 */
async function getPayloadSignatureHeader(
    payload: CreateSubscriptionPayload | UpdateSubscriptionPayload | Record<string, unknown>
): Promise<Record<string, string>> {
    if (typeof window === 'undefined') return {};
    
    const secretKey = process.env.NEXT_PUBLIC_PAYLOAD_SIGNATURE_SECRET;
    if (!secretKey) {
        // Signature verification not enabled - backward compatible
        return {};
    }
    
    try {
        const { generatePayloadSignature } = await import('./payload-signature');
        // Cast to Record<string, unknown> for signature generation
        const signature = await generatePayloadSignature(payload as Record<string, unknown>, secretKey);
        if (signature) {
            return { "X-Payload-Signature": signature };
        }
    } catch (error) {
        console.warn('Failed to generate payload signature:', error);
    }
    
    return {};
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
            console.warn("Unauthorized access to subscriptions - token may be expired");
            handleAuthError();
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
  
  // Calculate payments due this week (today + next 7 days)
  const today = new Date(now);
  today.setHours(0, 0, 0, 0); // Start of today
  
  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(today.getDate() + 7);
  oneWeekFromNow.setHours(23, 59, 59, 999); // End of the 7th day
  
  const upcoming = subs.filter(sub => {
    const billingDate = new Date(sub.nextBillingDate);
    billingDate.setHours(0, 0, 0, 0); // Normalize to start of day
    // Include today and next 7 days (8 days total)
    return billingDate >= today && billingDate <= oneWeekFromNow;
  }).length;

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
  category?: SubscriptionCategory;
  url?: string;
  account?: string;
  billing_date?: string;
  price?: string;
}

export interface UpdateSubscriptionPayload {
  plan?: string;
  billing_type?: "monthly" | "quarterly" | "annually";
  category?: SubscriptionCategory;
  url?: string;
  account?: string;
  billing_date?: string;
  price?: string;
}

export async function createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
  try {
    const signatureHeader = await getPayloadSignatureHeader(payload);
    const res = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...signatureHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("Unauthorized - token may be expired");
        handleAuthError();
        throw new Error("Authentication failed. Please log in again.");
      }
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
    const signatureHeader = await getPayloadSignatureHeader(payload);
    const res = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...signatureHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("Unauthorized - token may be expired");
        handleAuthError();
        throw new Error("Authentication failed. Please log in again.");
      }
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
      if (res.status === 401 || res.status === 403) {
        console.warn("Unauthorized - token may be expired");
        handleAuthError();
        throw new Error("Authentication failed. Please log in again.");
      }
      const error = await res.json().catch(() => ({ detail: "Failed to delete subscription" }));
      throw new Error(error.detail || "Failed to delete subscription");
    }
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}
