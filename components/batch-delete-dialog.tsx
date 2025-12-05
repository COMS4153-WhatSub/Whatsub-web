"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { BatchStatusResponse, getBatchDeletionStatus } from "@/lib/api";

interface BatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  onComplete: () => void;
}

export function BatchDeleteDialog({
  open,
  onOpenChange,
  batchId,
  onComplete,
}: BatchDeleteDialogProps) {
  const [status, setStatus] = useState<BatchStatusResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !batchId) {
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const maxPolls = 300; // Max 5 minutes
    let currentDelay = 1000; // Start with 1 second

    const pollStatus = async () => {
      try {
        const currentStatus = await getBatchDeletionStatus(batchId);
        setStatus(currentStatus);
        setError(null);
        pollCount++;

        // Stop polling if completed or failed
        if (currentStatus.status === "completed" || currentStatus.status === "failed") {
          setPolling(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          
          if (currentStatus.status === "completed") {
            // Wait a moment then call onComplete
            setTimeout(() => {
              onComplete();
              onOpenChange(false);
            }, 1500);
          }
          return;
        }

        // Check timeout
        if (pollCount >= maxPolls) {
          setPolling(false);
          setError("Polling timeout. Please refresh the page to check status.");
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          return;
        }

        // Exponential backoff: increase delay after each poll
        currentDelay = Math.min(currentDelay * 1.5, 10000);
        
        // Clear old interval and set new one with updated delay
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        pollInterval = setTimeout(() => {
          pollStatus();
        }, currentDelay);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get status");
        setPolling(false);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    // Start polling immediately, then continue with intervals
    setPolling(true);
    pollStatus();

    // Cleanup on unmount or when dialog closes
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [open, batchId, onComplete, onOpenChange]);

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    
    switch (status.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const getStatusText = () => {
    if (!status) return "Initializing...";
    
    switch (status.status) {
      case "pending":
        return "Waiting to start...";
      case "processing":
        return `Deleting subscriptions... (${status.processed_count}/${status.total_count})`;
      case "completed":
        return `Completed! ${status.success_count} deleted successfully${status.failed_count > 0 ? `, ${status.failed_count} failed` : ""}`;
      case "failed":
        return `Failed: ${status.error || "Unknown error"}`;
      default:
        return "Processing...";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Batch Deletion Progress
          </DialogTitle>
          <DialogDescription>
            {getStatusText()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {status && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(status.progress)}%</span>
                </div>
                <Progress value={status.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-semibold">{status.total_count}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Success</div>
                  <div className="font-semibold text-green-600">{status.success_count}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-semibold text-red-600">{status.failed_count}</div>
                </div>
              </div>

              {status.status === "completed" && status.results && status.failed_count > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <div className="text-sm font-semibold">Failed deletions:</div>
                  {status.results
                    .filter((r) => !r.success)
                    .map((r, idx) => (
                      <div key={idx} className="text-xs text-red-600 p-2 bg-red-50 rounded">
                        Subscription ID {r.subscription_id}: {r.error || "Unknown error"}
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {(status?.status === "completed" || status?.status === "failed") && (
            <Button
              onClick={() => {
                onOpenChange(false);
                if (status?.status === "completed") {
                  onComplete();
                }
              }}
              className="w-full"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

