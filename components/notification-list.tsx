"use client";

import { useEffect, useMemo } from "react";
import { useNotifications } from "@/lib/notification-context";
import { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) {
  const isRead = !!notification.read_at;

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
  };

  // Extract billing date from message if it's a payment notification
  const billingDate = useMemo(() => {
    if (!notification.message) return null;

    const dateMatch = notification.message.match(/due on (\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const date = parseISO(dateStr);
      if (isValid(date)) {
        return date;
      }
    }
    return null;
  }, [notification.message]);

  // Format time display
  const timeDisplay = useMemo(() => {
    if (billingDate) {
      const now = new Date();
      const diffMs = billingDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
        return `Due ${formatDistanceToNow(billingDate, { addSuffix: true })}`;
      } else if (diffHours < 24) {
        return `Due in ${Math.round(diffHours)} ${
          Math.round(diffHours) === 1 ? "hour" : "hours"
        }`;
      } else {
        return `Due on ${format(billingDate, "MMM d, yyyy")}`;
      }
    }
    return formatDistanceToNow(new Date(notification.created_at), {
      addSuffix: true,
    });
  }, [billingDate, notification.created_at]);

  return (
    <div
      className={cn(
        "group relative border-b transition-colors",
        !isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-background"
      )}
    >
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Unread indicator */}
          {!isRead && (
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4
                  className={cn(
                    "text-base leading-tight",
                    !isRead ? "font-semibold" : "font-medium"
                  )}
                >
                  {notification.subject || "Notification"}
                </h4>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {timeDisplay}
                </p>
              </div>

              {/* Mark as read button - only show if unread */}
              {!isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleMarkAsRead}
                  aria-label="Mark as read"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationList() {
  const {
    notifications,
    isLoading,
    markAllAsRead,
    markAsRead,
    refreshNotifications,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm h-8"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-base">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
