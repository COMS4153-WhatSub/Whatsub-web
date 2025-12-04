"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        ...toast,
        id,
        variant: toast.variant || "default",
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      const duration = newToast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "success" });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "error" });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "warning" });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string) => {
      addToast({ description: message, title, variant: "info" });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 w-full sm:w-auto max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  removeToast,
}: {
  toast: Toast;
  removeToast: (id: string) => void;
}) {
  const variantStyles = {
    default: "bg-background border-border",
    success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    warning: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  };

  const iconStyles = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const icons = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.variant || "default"];

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full",
        variantStyles[toast.variant || "default"]
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[toast.variant || "default"])} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm mb-1">{toast.title}</div>
        )}
        <div className="text-sm text-muted-foreground">{toast.description}</div>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

