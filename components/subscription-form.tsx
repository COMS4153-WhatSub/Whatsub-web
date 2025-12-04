"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Subscription, SubscriptionCategory } from "@/lib/types";
import {
  createSubscription,
  updateSubscription,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
} from "@/lib/api";
import { useToast } from "@/lib/toast";

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
  const toast = useToast();
  const [billingDate, setBillingDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    plan: "",
    billing_type: "monthly" as "monthly" | "quarterly" | "annually",
    category: "other" as SubscriptionCategory,
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

      const dateStr = subscription.nextBillingDate.split("T")[0];
      const date = dateStr ? new Date(dateStr) : undefined;

      setBillingDate(date);
      setFormData({
        plan: subscription.serviceName,
        billing_type: billingType,
        category: subscription.category || "other",
        price: subscription.price.toString(),
        url: subscription.url || "",
        account: subscription.account || "",
        billing_date: dateStr,
      });
    } else {
      // Reset form for new subscription
      setBillingDate(undefined);
      setFormData({
        plan: "",
        billing_type: "monthly",
        category: "other",
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
      // Format date for backend (YYYY-MM-DD)
      const formattedDate = billingDate ? format(billingDate, "yyyy-MM-dd") : undefined;

      if (subscription) {
        // Update existing subscription
        const updatePayload: UpdateSubscriptionPayload = {
          plan: formData.plan,
          billing_type: formData.billing_type,
          category: formData.category,
          price: formData.price || undefined,
          url: formData.url || undefined,
          account: formData.account || undefined,
          billing_date: formattedDate,
        };
        await updateSubscription(subscription.id, updatePayload);
      } else {
        // Create new subscription
        const createPayload: CreateSubscriptionPayload = {
          user_id: userId,
          plan: formData.plan,
          billing_type: formData.billing_type,
          category: formData.category,
          price: formData.price || undefined,
          url: formData.url || undefined,
          account: formData.account || undefined,
          billing_date: formattedDate,
        };
        await createSubscription(createPayload);
        toast.showSuccess("Subscription created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save subscription";
      setError(errorMessage);
      toast.showError(err, "Failed to save subscription");
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
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: SubscriptionCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="billing_date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !billingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {billingDate ? (
                      format(billingDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={billingDate}
                    onSelect={setBillingDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

