import { Subscription, SubscriptionStats, SubscriptionCategory, Notification } from "./types";
import { isTokenExpired, decodeJWT } from "./jwt-utils";
import { parseISO } from "date-fns";

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
    const billingDate = parseISO(sub.nextBillingDate);
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
    // Remove undefined values from payload to avoid JSON serialization issues
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    ) as CreateSubscriptionPayload;
    
    const signatureHeader = await getPayloadSignatureHeader(cleanPayload);
    const res = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...signatureHeader,
      },
      body: JSON.stringify(cleanPayload),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("Unauthorized - token may be expired");
        handleAuthError();
        throw new Error("Authentication failed. Please log in again.");
      }
      
      let errorMessage = "Failed to create subscription";
      let errorDetails: any = null;
      
      try {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
          errorDetails = errorJson;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
      
      console.error("Error creating subscription:", {
        status: res.status,
        statusText: res.statusText,
        url: `${API_BASE_URL}/subscriptions`,
        payload,
        errorMessage,
        errorDetails,
      });
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return adaptSubscription(data);
  } catch (error) {
    console.error("Error creating subscription:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to server. Please check if the backend service is running.");
    }
    throw error;
  }
}

export async function updateSubscription(
  subscriptionId: string,
  payload: UpdateSubscriptionPayload
): Promise<Subscription> {
  try {
    // Remove undefined values from payload to avoid JSON serialization issues
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    ) as UpdateSubscriptionPayload;
    
    const signatureHeader = await getPayloadSignatureHeader(cleanPayload);
    const res = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...signatureHeader,
      },
      body: JSON.stringify(cleanPayload),
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

// Admin API functions

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  primary_phone: string | null;
  role: "user" | "admin";
}

export interface AdminStats {
  total_users: number;
  total_subscriptions: number;
  active_subscriptions: number;
  total_monthly_revenue: number;
  subscriptions_by_category: Record<string, number>;
  subscriptions_by_status: Record<string, number>;
}

/**
 * Get role from JWT token
 */
export function getRoleFromToken(token: string): "user" | "admin" {
  const payload = decodeJWT(token);
  return (payload?.role as "user" | "admin") || "user";
}

/**
 * List all users (Admin only)
 */
export async function listAllUsers(): Promise<AdminUser[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to fetch users";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error(`Failed to fetch users: ${res.status} ${res.statusText}`, errorMessage);
      
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
      }
      throw new Error(`${res.status}: ${errorMessage}`);
    }
    
    const data = await res.json();
    // Handle both array and paginated response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.items)) {
      return data.items;
    } else {
      // Fallback: return empty array if unexpected format
      console.warn("Unexpected response format from /admin/users:", data);
      return [];
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error fetching users:", error);
      throw new Error("Network error: Unable to connect to server. Please check if the backend service is running.");
    }
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Get user by ID (Admin only)
 */
export async function getUserById(userId: string): Promise<AdminUser> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
      }
      throw new Error("Failed to fetch user");
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

/**
 * List all subscriptions (Admin only)
 */
export async function listAllSubscriptions(page: number = 1, limit: number = 50): Promise<{ items: Subscription[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/subscriptions?page=${page}&limit=${limit}`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to fetch subscriptions";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error(`Failed to fetch subscriptions: ${res.status} ${res.statusText}`, errorMessage);
      
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
      }
      throw new Error(`${res.status}: ${errorMessage}`);
    }
    
    const json = await res.json();
    return {
      items: (json.items || []).map(adaptSubscription),
      total: json.total || 0,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error fetching subscriptions:", error);
      throw new Error("Network error: Unable to connect to server. Please check if the backend service is running.");
    }
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
}

/**
 * Get admin statistics (Admin only)
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to fetch admin stats";
      let errorDetails: any = null;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
        errorDetails = errorJson;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      // Log detailed error information for debugging
      console.error("Admin stats API error:", {
        status: res.status,
        statusText: res.statusText,
        url: `${API_BASE_URL}/admin/stats`,
        errorMessage,
        errorDetails,
        responseText: errorText,
      });
      
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
      }
      
      // Create a more detailed error message
      const detailedError = new Error(`${res.status}: ${errorMessage}`);
      (detailedError as any).status = res.status;
      (detailedError as any).details = errorDetails;
      (detailedError as any).responseText = errorText;
      throw detailedError;
    }
    
    const data = await res.json();
    console.log("Admin stats response:", data);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error fetching admin stats:", error);
      throw new Error("Network error: Unable to connect to server. Please check if the backend service is running.");
    }
    console.error("Error fetching admin stats:", error);
    throw error;
  }
}

// Notification API functions
// Use composite service URL to avoid mixed content issues (HTTPS -> HTTP)
// The composite service will proxy requests to the notification service

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    const url = `${API_BASE_URL}/notifications?user_id=${userId}${unreadOnly ? "&unread_only=true" : ""}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        handleAuthError();
      }
      console.warn(`Failed to fetch notifications: ${res.status} ${res.statusText}`);
      return [];
    }

    return await res.json();
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn("Notification service unavailable or network error");
    } else {
      console.error("Error fetching notifications:", error);
    }
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const url = `${API_BASE_URL}/notifications/unread-count?user_id=${userId}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();
    return data.unread_count || 0;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn("Notification service unavailable for unread count");
    } else {
      console.error("Error fetching unread count:", error);
    }
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: string
): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/notifications/${notificationId}/read?user_id=${userId}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}
