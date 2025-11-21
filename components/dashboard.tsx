"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Color palette for pie chart
const COLORS = [
  "#E50914", // Red
  "#1DB954", // Green
  "#007AFF", // Blue
  "#FF9500", // Orange
  "#AF52DE", // Purple
  "#5AC8FA", // Light Blue
  "#FF2D55", // Pink
  "#FFCC00", // Yellow
  "#34C759", // Mint
  "#FF6B6B", // Coral
];

interface DashboardProps {
  subscriptions: Subscription[];
  stats: SubscriptionStats;
  userId: string;
  onRefresh: () => void;
}

export function Dashboard({ subscriptions, stats, userId, onRefresh }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare pie chart data from subscriptions
  const pieChartData = subscriptions.map((sub, index) => ({
    name: sub.serviceName,
    value: sub.price,
    fill: COLORS[index % COLORS.length],
  }));

  // Create chart config dynamically
  const chartConfig = subscriptions.reduce(
    (config, sub, index) => ({
      ...config,
      [sub.serviceName.toLowerCase().replace(/\s+/g, "")]: {
        label: sub.serviceName,
        color: COLORS[index % COLORS.length],
      },
    }),
    {} as Record<string, { label: string; color: string }>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Section: Stats (left) + Pie Chart (right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Stat Cards */}
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

        {/* Right: Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: unknown) => `$${Number(value).toFixed(2)}`}
                      />
                    }
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

      {/* Bottom Section: Subscription List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Subscriptions</CardTitle>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No subscriptions found matching your search." : "No subscriptions yet. Add your first subscription to get started!"}
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
