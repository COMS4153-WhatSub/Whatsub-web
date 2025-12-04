/**
 * Unified error handling and toast utilities
 * Provides helper functions for common error scenarios
 */

import { useToast as useToastHook } from "@/components/ui/toast";

/**
 * Handle API errors and show appropriate toast messages
 */
export function handleApiError(error: unknown, defaultMessage = "An error occurred"): string {
  let message = defaultMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  }

  // Extract meaningful error messages from common patterns
  if (message.includes("401") || message.includes("Unauthorized")) {
    return "Your session has expired. Please log in again.";
  }
  if (message.includes("403") || message.includes("Forbidden")) {
    return "You don't have permission to perform this action.";
  }
  if (message.includes("404") || message.includes("Not found")) {
    return "The requested resource was not found.";
  }
  if (message.includes("500") || message.includes("Internal Server Error")) {
    return "A server error occurred. Please try again later.";
  }
  if (message.includes("Network") || message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return message;
}

/**
 * Hook for easy toast access with error handling
 */
export function useToast() {
  const toast = useToastHook();

  const showError = (error: unknown, title?: string) => {
    const message = handleApiError(error);
    toast.error(message, title);
  };

  const showSuccess = (message: string, title?: string) => {
    toast.success(message, title);
  };

  const showWarning = (message: string, title?: string) => {
    toast.warning(message, title);
  };

  const showInfo = (message: string, title?: string) => {
    toast.info(message, title);
  };

  return {
    ...toast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

