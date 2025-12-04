"use client";

import { useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/lib/notification-context";
import { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format, parseISO, isValid } from "date-fns";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function NotificationItem({ 
  notification, 
  onHide 
}: { 
  notification: Notification;
  onHide: () => void;
}) {
  const { markAsRead } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const isRead = !!notification.read_at;

  // Check if message is long enough to need expansion
  const messageLines = notification.message?.split('\n') || [];
  const needsExpansion = messageLines.length > 2 || (notification.message?.length || 0) > 150;

  const handleClick = (e: React.MouseEvent) => {
    // Don't mark as read if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (!isRead) {
      markAsRead(notification.id);
    }
    
    // Toggle expansion on click
    if (needsExpansion) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Mark as read when hiding
    if (!isRead) {
      markAsRead(notification.id);
    }
    onHide();
  };

  // Extract billing date from message if it's a payment notification
  const billingDate = useMemo(() => {
    if (!notification.message) return null;
    
    // Try to extract date from message like "due on 2025-12-05"
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

  // Format time display - show billing date if available, otherwise show notification time
  const timeDisplay = useMemo(() => {
    if (billingDate) {
      const now = new Date();
      const diffMs = billingDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 0) {
        return `Due ${formatDistanceToNow(billingDate, { addSuffix: true })}`;
      } else if (diffHours < 24) {
        return `Due in ${Math.round(diffHours)} ${Math.round(diffHours) === 1 ? 'hour' : 'hours'}`;
      } else {
        return `Due on ${format(billingDate, 'MMM d, yyyy')}`;
      }
    }
    // Fallback to notification creation time
    return formatDistanceToNow(new Date(notification.created_at), {
      addSuffix: true,
    });
  }, [billingDate, notification.created_at]);

  return (
    <div
      className={cn(
        "group relative border-b transition-colors",
        !isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-background",
        "hover:bg-accent"
      )}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          {/* Unread indicator */}
          {!isRead && (
            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "text-sm font-semibold leading-tight",
                !isRead && "font-bold"
              )}>
                {notification.subject || "Notification"}
              </h4>
              
              {/* Hide button - appears on hover */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0"
                onClick={handleHide}
                aria-label="Hide notification"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            {notification.message && (
              <div className="mt-2">
                <p className={cn(
                  "text-xs text-muted-foreground whitespace-pre-wrap",
                  !isExpanded && needsExpansion && "line-clamp-3"
                )}>
                  {notification.message}
                </p>
                {needsExpansion && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="mt-1.5 text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2.5">
              {timeDisplay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationList() {
  const { notifications, isLoading, markAllAsRead, refreshNotifications } =
    useNotifications();
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filter out hidden notifications
  const visibleNotifications = notifications.filter(
    (n) => !hiddenIds.has(n.id)
  );

  const unreadCount = visibleNotifications.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unreadCount} unread)
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs h-7"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div>
            {visibleNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onHide={() => setHiddenIds((prev) => new Set(prev).add(notification.id))}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

