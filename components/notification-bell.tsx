"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/lib/notification-context";
import { NotificationList } from "./notification-list";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { unreadCount, isLoading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[calc(100vw-1rem)] max-w-[380px] p-0 mr-2"
        sideOffset={8}
        collisionPadding={8}
        avoidCollisions={true}
      >
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
