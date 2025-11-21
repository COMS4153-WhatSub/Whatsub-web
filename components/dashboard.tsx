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
