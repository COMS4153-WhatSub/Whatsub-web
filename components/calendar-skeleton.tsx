import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-[140px]" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-[100px] mb-1" />
              <Skeleton className="h-7 w-[80px]" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-[140px]" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {[...Array(7)].map((_, i) => (
              <div key={i} className="text-center p-2">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}

            {/* Calendar Days */}
            {[...Array(35)].map((_, i) => (
              <div key={i} className="p-2 min-h-[100px] border rounded-lg">
                <Skeleton className="h-4 w-4 mb-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[220px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
                <Skeleton className="h-6 w-[60px] rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
