"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/stat-card";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionForm } from "@/components/subscription-form";
import { Subscription, SubscriptionStats } from "@/lib/types";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  Filter,
  X,
} from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  streaming: "#E50914",
  music: "#1DB954",
  software: "#007AFF",
  gaming: "#FF9500",
  cloud: "#5AC8FA",
  news: "#FF2D55",
  fitness: "#34C759",
  education: "#AF52DE",
  other: "#6B7280",
};

const FALLBACK_COLORS = [
  "#E50914",
  "#1DB954",
  "#007AFF",
  "#FF9500",
  "#AF52DE",
  "#5AC8FA",
  "#FF2D55",
  "#FFCC00",
  "#34C759",
  "#FF6B6B",
];

interface DashboardProps {
  subscriptions: Subscription[];
  stats: SubscriptionStats;
  userId: string;
  onRefresh: () => void;
}

type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "billing-cycle-asc"
  | "billing-cycle-desc"
  | "date-asc"
  | "date-desc";

export function Dashboard({
  subscriptions,
  stats,
  userId,
  onRefresh,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    subscriptions.forEach((sub) => {
      if (sub.category) {
        categories.add(sub.category);
      }
    });
    return Array.from(categories).sort();
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter((sub) => {
      const matchesSearch = sub.serviceName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || sub.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.serviceName.localeCompare(b.serviceName);
        case "name-desc":
          return b.serviceName.localeCompare(a.serviceName);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "billing-cycle-asc": {
          const cycleOrder = { monthly: 1, quarterly: 2, yearly: 3 };
          return (
            (cycleOrder[a.billingCycle] || 0) -
            (cycleOrder[b.billingCycle] || 0)
          );
        }
        case "billing-cycle-desc": {
          const cycleOrder = { monthly: 1, quarterly: 2, yearly: 3 };
          return (
            (cycleOrder[b.billingCycle] || 0) -
            (cycleOrder[a.billingCycle] || 0)
          );
        }
        case "date-asc":
          return (
            new Date(a.nextBillingDate).getTime() -
            new Date(b.nextBillingDate).getTime()
          );
        case "date-desc":
          return (
            new Date(b.nextBillingDate).getTime() -
            new Date(a.nextBillingDate).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [subscriptions, searchQuery, selectedCategory, sortOption]);

  // Calculate pie chart data
  const pieChartData = useMemo(() => {
    const categoryMap = subscriptions.reduce((acc, sub) => {
      const category = sub.category || "other";

      // Convert to monthly equivalent
      let monthlyPrice = sub.price;
      if (sub.billingCycle === "quarterly") {
        monthlyPrice = sub.price / 3;
      } else if (sub.billingCycle === "yearly") {
        monthlyPrice = sub.price / 12;
      }

      if (!acc[category]) {
        acc[category] = {
          category,
          total: 0,
          count: 0,
        };
      }

      acc[category].total += monthlyPrice;
      acc[category].count += 1;

      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    const data = Object.values(categoryMap).map((item, index) => {
      const categoryKey = item.category.toLowerCase();
      return {
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        value: Number(item.total.toFixed(2)),
        count: item.count,
        fill:
          CATEGORY_COLORS[categoryKey] ||
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      };
    });

    return data.sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const chartConfig = pieChartData.reduce(
    (config, data) => ({
      ...config,
      [data.name]: {
        label: data.name,
        color: data.fill,
      },
    }),
    {} as Record<string, { label: string; color: string }>
  );

  const totalMonthlySpending = pieChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 grid-cols-2">
          <StatCard
            title="Total Subscriptions"
            value={stats.totalSubscriptions}
            icon={CreditCard}
          />
          <StatCard
            title="Monthly Total"
            value={`$${stats.monthlyTotal.toFixed(2)}`}
            icon={DollarSign}
          />
          <StatCard
            title="Yearly Total"
            value={`$${stats.yearlyTotal.toFixed(2)}`}
            icon={TrendingUp}
          />
          <StatCard
            title="Due This Week"
            value={stats.upcomingPayments}
            icon={AlertCircle}
          />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Monthly Spending</CardTitle>
            <p className="text-sm text-muted-foreground">
              ${totalMonthlySpending.toFixed(2)}/month across categories
            </p>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = (
                          (data.value / totalMonthlySpending) *
                          100
                        ).toFixed(1);
                        return (
                          <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} subscription
                              {data.count > 1 ? "s" : ""}
                            </p>
                            <p className="font-bold text-primary">
                              ${data.value.toFixed(2)}/mo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {percentage}% of total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No subscriptions to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Subscriptions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredSubscriptions.length === subscriptions.length
                  ? `${subscriptions.length} total`
                  : `Showing ${filteredSubscriptions.length} of ${subscriptions.length}`}
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </div>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
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

              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value as SortOption)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">
                    Price (High to Low)
                  </SelectItem>
                  <SelectItem value="billing-cycle-asc">
                    Billing Cycle (Monthly → Yearly)
                  </SelectItem>
                  <SelectItem value="billing-cycle-desc">
                    Billing Cycle (Yearly → Monthly)
                  </SelectItem>
                  <SelectItem value="date-asc">
                    Next Billing (Earliest)
                  </SelectItem>
                  <SelectItem value="date-desc">
                    Next Billing (Latest)
                  </SelectItem>
                </SelectContent>
              </Select>

              {(selectedCategory !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery
                ? "No subscriptions found matching your search."
                : "No subscriptions yet. Add your first subscription to get started!"}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  userId={userId}
                  onUpdate={onRefresh}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        subscription={null}
        userId={userId}
        onSuccess={onRefresh}
      />
    </div>
  );
}
