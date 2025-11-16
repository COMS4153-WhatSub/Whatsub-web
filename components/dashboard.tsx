"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { SubscriptionCard } from "@/components/subscription-card";
import { Subscription, SubscriptionStats } from "@/lib/types";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
} from "lucide-react";
import { useState } from "react";

interface DashboardProps {
  subscriptions: Subscription[];
  stats: SubscriptionStats;
}

export function Dashboard({ subscriptions, stats }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Subscriptions"
          value={stats.totalSubscriptions}
          icon={CreditCard}
        />
        <StatCard
          title="Monthly Total"
          value={`$${stats.monthlyTotal}`}
          icon={DollarSign}
        />
        <StatCard
          title="Yearly Total"
          value={`$${stats.yearlyTotal}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Due This Week"
          value={stats.upcomingPayments}
          icon={AlertCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
