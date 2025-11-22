"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listAllUsers,
  listAllSubscriptions,
  getAdminStats,
  type AdminUser,
  type AdminStats,
} from "@/lib/api";
import { Subscription } from "@/lib/types";
import { Users, CreditCard, TrendingUp, DollarSign, Loader2, Search, Filter, X } from "lucide-react";
import { Pie, PieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  streaming: "#E50914", // Red (Netflix style)
  music: "#1DB954", // Green (Spotify style)
  software: "#007AFF", // Blue
  gaming: "#FF9500", // Orange
  cloud: "#5AC8FA", // Light Blue
  news: "#FF2D55", // Pink
  fitness: "#34C759", // Mint
  education: "#AF52DE", // Purple
  other: "#6B7280", // Gray
};

// Billing type colors
const BILLING_TYPE_COLORS: Record<string, string> = {
  monthly: "#3B82F6", // Blue
  quarterly: "#10B981", // Green
  yearly: "#F59E0B", // Orange
  annually: "#F59E0B", // Alias for yearly
};

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // User search and filter states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  
  // Subscription search and filter states
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState("");
  const [subscriptionCategoryFilter, setSubscriptionCategoryFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
    
    loadData();
  }, [isAuthenticated, authLoading, isAdmin, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrors({});
      
      // Load data with individual error handling
      const results = await Promise.allSettled([
        listAllUsers().catch(err => {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch users";
          console.error("Error fetching users:", err);
          setErrors(prev => ({ ...prev, users: errorMsg }));
          throw err;
        }),
        listAllSubscriptions(1, 100).catch(err => {
          const errorMsg = err instanceof Error ? err.message : "Failed to fetch subscriptions";
          console.error("Error fetching subscriptions:", err);
          setErrors(prev => ({ ...prev, subscriptions: errorMsg }));
          throw err;
        }),
        getAdminStats().catch(err => {
          let errorMsg = "Failed to fetch admin stats";
          if (err instanceof Error) {
            errorMsg = err.message;
            // Include additional error details if available
            if ((err as any).details) {
              console.error("Admin stats error details:", (err as any).details);
            }
            if ((err as any).responseText) {
              console.error("Admin stats response text:", (err as any).responseText);
            }
          }
          console.error("Error fetching admin stats:", err);
          setErrors(prev => ({ ...prev, stats: errorMsg }));
          throw err;
        }),
      ]);
      
      // Process successful results
      if (results[0].status === "fulfilled") {
        setUsers(results[0].value);
      }
      if (results[1].status === "fulfilled") {
        setSubscriptions(results[1].value.items);
      }
      if (results[2].status === "fulfilled") {
        setStats(results[2].value);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from subscriptions
  // NOTE: All hooks must be called before any conditional returns
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    subscriptions.forEach((sub) => {
      if (sub.category) {
        categories.add(sub.category);
      }
    });
    return Array.from(categories).sort();
  }, [subscriptions]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const searchLower = userSearchQuery.toLowerCase();
      const matchesSearch =
        user.email.toLowerCase().includes(searchLower) ||
        (user.full_name?.toLowerCase().includes(searchLower) ?? false);
      
      // Role filter
      const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, userSearchQuery, userRoleFilter]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search filter
      const searchLower = subscriptionSearchQuery.toLowerCase();
      const matchesSearch = sub.serviceName.toLowerCase().includes(searchLower);
      
      // Category filter
      const matchesCategory =
        subscriptionCategoryFilter === "all" || sub.category === subscriptionCategoryFilter;
      
      // Price range filter
      let matchesPrice = true;
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (!isNaN(min) && sub.price < min) {
          matchesPrice = false;
        }
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (!isNaN(max) && sub.price > max) {
          matchesPrice = false;
        }
      }
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [subscriptions, subscriptionSearchQuery, subscriptionCategoryFilter, priceMin, priceMax]);

  // Clear all filters
  const clearUserFilters = () => {
    setUserSearchQuery("");
    setUserRoleFilter("all");
  };

  const clearSubscriptionFilters = () => {
    setSubscriptionSearchQuery("");
    setSubscriptionCategoryFilter("all");
    setPriceMin("");
    setPriceMax("");
  };

  const hasUserFilters = userSearchQuery || userRoleFilter !== "all";
  const hasSubscriptionFilters =
    subscriptionSearchQuery ||
    subscriptionCategoryFilter !== "all" ||
    priceMin ||
    priceMax;

  // Chart data calculations
  // 1. Category distribution pie chart (by subscription count)
  const categoryDistributionData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const category = sub.category || "other";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      fill: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
    }));
  }, [subscriptions]);

  const categoryDistributionConfig = useMemo(() => {
    return categoryDistributionData.reduce(
      (config, data) => ({
        ...config,
        [data.name]: {
          label: data.name,
          color: data.fill,
        },
      }),
      {} as Record<string, { label: string; color: string }>
    );
  }, [categoryDistributionData]);

  // 2. Revenue by category bar chart (monthly revenue)
  const revenueByCategoryData = useMemo(() => {
    const categoryRevenue: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const category = sub.category || "other";
      let monthlyPrice = sub.price;
      if (sub.billingCycle === "quarterly") {
        monthlyPrice = sub.price / 3;
      } else if (sub.billingCycle === "yearly") {
        monthlyPrice = sub.price / 12;
      }
      categoryRevenue[category] = (categoryRevenue[category] || 0) + monthlyPrice;
    });

    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        revenue: Number(revenue.toFixed(2)),
        fill: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [subscriptions]);

  const revenueByCategoryConfig = useMemo(() => {
    return {
      revenue: {
        label: "Monthly Revenue",
        color: "hsl(var(--chart-1))",
      },
    };
  }, []);

  // 3. Billing type distribution pie chart
  const billingTypeDistributionData = useMemo(() => {
    const billingTypeCounts: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const billingType = sub.billingCycle || "monthly";
      billingTypeCounts[billingType] = (billingTypeCounts[billingType] || 0) + 1;
    });

    return Object.entries(billingTypeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      fill: BILLING_TYPE_COLORS[type] || BILLING_TYPE_COLORS.monthly,
    }));
  }, [subscriptions]);

  const billingTypeDistributionConfig = useMemo(() => {
    return billingTypeDistributionData.reduce(
      (config, data) => ({
        ...config,
        [data.name]: {
          label: data.name,
          color: data.fill,
        },
      }),
      {} as Record<string, { label: string; color: string }>
    );
  }, [billingTypeDistributionData]);

  // 4. User subscription count distribution bar chart
  const userSubscriptionCountData = useMemo(() => {
    const userCounts: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      userCounts[sub.userId] = (userCounts[sub.userId] || 0) + 1;
    });

    // Group by subscription count ranges
    const countRanges: Record<string, number> = {
      "1": 0,
      "2-3": 0,
      "4-5": 0,
      "6-10": 0,
      "11+": 0,
    };

    Object.values(userCounts).forEach((count) => {
      if (count === 1) {
        countRanges["1"]++;
      } else if (count >= 2 && count <= 3) {
        countRanges["2-3"]++;
      } else if (count >= 4 && count <= 5) {
        countRanges["4-5"]++;
      } else if (count >= 6 && count <= 10) {
        countRanges["6-10"]++;
      } else {
        countRanges["11+"]++;
      }
    });

    return Object.entries(countRanges)
      .filter(([_, count]) => count > 0)
      .map(([range, count]) => ({
        range: `${range} subscription${range === "1" ? "" : "s"}`,
        users: count,
      }));
  }, [subscriptions]);

  const userSubscriptionCountConfig = useMemo(() => {
    return {
      users: {
        label: "Number of Users",
        color: "hsl(var(--chart-2))",
      },
    };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users and subscriptions across the platform
        </p>
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>
                  <strong>{key}:</strong> {message}
                </li>
              ))}
            </ul>
            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-600">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Check browser console (F12) for detailed error information.</p>
              <p className="mt-1">API URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}</p>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_subscriptions}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_subscriptions} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats.total_monthly_revenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">per month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.active_subscriptions / stats.total_subscriptions) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscriptions.slice(0, 5).map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{sub.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          ${sub.price}/{sub.billingCycle}
                        </p>
                      </div>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Visualization Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Category Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryDistributionData.length > 0 ? (
                  <ChartContainer config={categoryDistributionConfig} className="min-h-[300px] w-full">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: unknown) => `${value} subscriptions`}
                          />
                        }
                      />
                      <Pie
                        data={categoryDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Revenue by Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByCategoryData.length > 0 ? (
                  <ChartContainer config={revenueByCategoryConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={revenueByCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: unknown) => `$${Number(value).toFixed(2)}`}
                          />
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Billing Type Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Billing Type</CardTitle>
              </CardHeader>
              <CardContent>
                {billingTypeDistributionData.length > 0 ? (
                  <ChartContainer
                    config={billingTypeDistributionConfig}
                    className="min-h-[300px] w-full"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: unknown) => `${value} subscriptions`}
                          />
                        }
                      />
                      <Pie
                        data={billingTypeDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {billingTypeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        verticalAlign="bottom"
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. User Subscription Count Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Users by Subscription Count</CardTitle>
              </CardHeader>
              <CardContent>
                {userSubscriptionCountData.length > 0 ? (
                  <ChartContainer
                    config={userSubscriptionCountConfig}
                    className="min-h-[300px] w-full"
                  >
                    <BarChart accessibilityLayer data={userSubscriptionCountData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="range"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value: unknown) => `${value} users`}
                          />
                        }
                      />
                      <Bar
                        dataKey="users"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>
                  
                  {/* Role Filter */}
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters Button */}
                  {hasUserFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUserFilters}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Results Count */}
                <p className="text-sm text-muted-foreground">
                  {filteredUsers.length === users.length
                    ? `${users.length} total`
                    : `Showing ${filteredUsers.length} of ${users.length}`}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching your filters.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name || "No name"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.primary_phone && (
                        <p className="text-sm text-muted-foreground">{user.primary_phone}</p>
                      )}
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Subscriptions</CardTitle>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by service name..."
                    value={subscriptionSearchQuery}
                    onChange={(e) => setSubscriptionSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                  </div>
                  
                  {/* Category Filter */}
                  <Select
                    value={subscriptionCategoryFilter}
                    onValueChange={setSubscriptionCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px] min-w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Price Range Filters */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-[120px]"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-[120px]"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Clear Filters Button */}
                  {hasSubscriptionFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSubscriptionFilters}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Results Count */}
                <p className="text-sm text-muted-foreground">
                  {filteredSubscriptions.length === subscriptions.length
                    ? `${subscriptions.length} total`
                    : `Showing ${filteredSubscriptions.length} of ${subscriptions.length}`}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscriptions found matching your filters.
                  </div>
                ) : (
                  filteredSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{sub.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.category} • ${sub.price}/{sub.billingCycle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        User: {sub.userId} • Next billing: {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

