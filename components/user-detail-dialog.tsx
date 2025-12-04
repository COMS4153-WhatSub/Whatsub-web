"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AdminUser } from "@/lib/api";
import { Subscription } from "@/lib/types";
import { parseISO, format } from "date-fns";
import { CreditCard, Calendar, DollarSign } from "lucide-react";

interface UserDetailDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSubscriptions?: Subscription[]; // Pass all subscriptions from admin page
}

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
  allSubscriptions = [],
}: UserDetailDialogProps) {
  // Filter subscriptions for this user from all subscriptions
  const subscriptions = useMemo(() => {
    if (!user || !allSubscriptions.length) return [];
    return allSubscriptions.filter((sub) => sub.userId === user.id);
  }, [user, allSubscriptions]);

  if (!user) return null;

  const totalMonthlyRevenue = subscriptions.reduce((sum, sub) => {
    let monthlyPrice = sub.price;
    if (sub.billingCycle === "quarterly") {
      monthlyPrice = sub.price / 3;
    } else if (sub.billingCycle === "yearly") {
      monthlyPrice = sub.price / 12;
    }
    return sum + monthlyPrice;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user information and their subscriptions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user.full_name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                {user.primary_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.primary_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                    <p className="text-2xl font-bold">{subscriptions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold">${totalMonthlyRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions List */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No subscriptions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{sub.icon || "📦"}</span>
                              <div>
                                <p className="font-semibold">{sub.serviceName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {sub.category}
                                  </Badge>
                                  <Badge
                                    variant={sub.status === "active" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {sub.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 mt-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  ${sub.price} / {sub.billingCycle}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Next billing: {format(parseISO(sub.nextBillingDate), "MMM dd, yyyy")}
                                </span>
                              </div>
                              {sub.account && (
                                <p className="text-sm text-muted-foreground">
                                  Account: {sub.account}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

