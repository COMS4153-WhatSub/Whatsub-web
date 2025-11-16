import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Subscription } from "@/lib/types";
import { Calendar, DollarSign } from "lucide-react";

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{subscription.icon || "📦"}</div>
          <div>
            <CardTitle className="text-lg">
              {subscription.serviceName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {subscription.description}
            </p>
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
            Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
          </span>
        </div>
        <Badge>{subscription.status}</Badge>
      </CardContent>
    </Card>
  );
}
