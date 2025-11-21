"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Subscription } from "@/lib/types";
import {
  createSubscription,
  updateSubscription,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
} from "@/lib/api";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  userId: string;
  onSuccess: () => void;
}

export function SubscriptionForm({
  open,
  onOpenChange,
  subscription,
  userId,
  onSuccess,
}: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    plan: "",
    billing_type: "monthly" as "monthly" | "quarterly" | "annually",
    price: "",
    url: "",
    account: "",
    billing_date: "",
  });

  useEffect(() => {
    if (subscription) {
      // Map frontend billingCycle to backend billing_type
      let billingType: "monthly" | "quarterly" | "annually" = "monthly";
      if (subscription.billingCycle === "yearly") billingType = "annually";
      else if (subscription.billingCycle === "quarterly") billingType = "quarterly";

      setFormData({
        plan: subscription.serviceName,
        billing_type: billingType,
        price: subscription.price.toString(),
        url: subscription.url || "",
        account: subscription.account || "",
        billing_date: subscription.nextBillingDate.split("T")[0],
      });
    } else {
      // Reset form for new subscription
      setFormData({
        plan: "",
        billing_type: "monthly",
        price: "",
        url: "",
        account: "",
        billing_date: "",
      });
    }
    setError(null);
  }, [subscription, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (subscription) {
        // Update existing subscription
        const updatePayload: UpdateSubscriptionPayload = {
          plan: formData.plan,
          billing_type: formData.billing_type,
          price: formData.price || undefined,
          url: formData.url || undefined,
          account: formData.account || undefined,
          billing_date: formData.billing_date || undefined,
        };
        await updateSubscription(subscription.id, updatePayload);
      } else {
        // Create new subscription
        const createPayload: CreateSubscriptionPayload = {
          user_id: userId,
          plan: formData.plan,
          billing_type: formData.billing_type,
          price: formData.price || undefined,
          url: formData.url || undefined,
          account: formData.account || undefined,
          billing_date: formData.billing_date || undefined,
        };
        await createSubscription(createPayload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Edit Subscription" : "Add New Subscription"}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? "Update your subscription details below."
              : "Add a new subscription to track your recurring payments."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="plan" className="text-sm font-medium">
                Service Name *
              </label>
              <Input
                id="plan"
                placeholder="e.g., Netflix Premium"
                value={formData.plan}
                onChange={(e) =>
                  setFormData({ ...formData, plan: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="billing_type" className="text-sm font-medium">
                Billing Cycle *
              </label>
              <Select
                value={formData.billing_type}
                onValueChange={(value: "monthly" | "quarterly" | "annually") =>
                  setFormData({ ...formData, billing_type: value })
                }
              >
                <SelectTrigger id="billing_type">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 15.99"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="account" className="text-sm font-medium">
                Account
              </label>
              <Input
                id="account"
                placeholder="e.g., user@example.com"
                value={formData.account}
                onChange={(e) =>
                  setFormData({ ...formData, account: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="billing_date" className="text-sm font-medium">
                Next Billing Date
              </label>
              <Input
                id="billing_date"
                type="date"
                value={formData.billing_date}
                onChange={(e) =>
                  setFormData({ ...formData, billing_date: e.target.value })
                }
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : subscription ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

