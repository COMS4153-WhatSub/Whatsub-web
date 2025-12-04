"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { Notification } from "./types";
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from "./api";
import { useAuth } from "./auth-context";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userId, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(userId, false),
        getUnreadNotificationCount(userId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
      // Don't show error to user, just log it
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (!userId) return;

    try {
      const success = await markNotificationAsRead(notificationId, userId);
      if (success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        // Refresh unread count
        const count = await getUnreadNotificationCount(userId);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read_at);
      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id, userId)));
      await refreshNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [userId, notifications, refreshNotifications]);

  // Initial load and refresh on auth change
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 30000); // Poll every 30 seconds

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthenticated, userId, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

