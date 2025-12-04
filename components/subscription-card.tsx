"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/lib/types";
import { Calendar, DollarSign, Edit, Trash2 } from "lucide-react";
import { SubscriptionForm } from "@/components/subscription-form";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { deleteSubscription } from "@/lib/api";
import { parseISO, format } from "date-fns";
import { useToast } from "@/lib/toast";

interface SubscriptionCardProps {
  subscription: Subscription;
  userId: string;
  onUpdate: () => void;
}

export function SubscriptionCard({ subscription, userId, onUpdate }: SubscriptionCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSubscription(subscription.id);
      toast.showSuccess(`${subscription.serviceName} deleted successfully`);
      onUpdate();
      setDeleteOpen(false);
    } catch (error) {
      toast.showError(error, "Failed to delete subscription");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">{subscription.icon || "📦"}</div>
              <div className="flex-1">
            <CardTitle className="text-lg">
              {subscription.serviceName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {subscription.description}
            </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="text-2xl font-bold">${subscription.price}</span>
          <span className="text-sm text-muted-foreground">
            / {subscription.billingCycle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            Next: {format(parseISO(subscription.nextBillingDate), "MMM dd, yyyy")}
          </span>
        </div>
        <Badge>{subscription.status}</Badge>
      </CardContent>
    </Card>

      <SubscriptionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        subscription={subscription}
        userId={userId}
        onSuccess={onUpdate}
      />

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        subscriptionName={subscription.serviceName}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
