"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Subscription } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  getDay,
} from "date-fns";

interface PaymentCalendarProps {
  subscriptions: Subscription[];
}

export function PaymentCalendar({ subscriptions }: PaymentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const getSubscriptionsForDay = (day: Date) => {
    return subscriptions.filter((sub) => {
      const billingDate = parseISO(sub.nextBillingDate);
      return isSameDay(billingDate, day);
    });
  };

  const monthTotal = subscriptions
    .filter((sub) => {
      const billingDate = parseISO(sub.nextBillingDate);
      return isSameMonth(billingDate, currentDate);
    })
    .reduce((sum, sub) => sum + sub.price, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Payment Calendar
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">This Month Total</p>
              <p className="text-2xl font-bold">${monthTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm text-muted-foreground p-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells */}
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="p-2 min-h-[100px]" />
            ))}

            {/* Calendar Days */}
            {daysInMonth.map((day) => {
              const daySubscriptions = getSubscriptionsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 min-h-[100px] border rounded-lg ${
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  } hover:bg-accent transition-colors`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {format(day, "d")}
                  </div>
                  {daySubscriptions.length > 0 && (
                    <div className="space-y-1">
                      {daySubscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="text-xs p-1 bg-primary/10 rounded truncate"
                          title={`${sub.serviceName} - $${sub.price}`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{sub.icon}</span>
                            <span className="truncate">{sub.serviceName}</span>
                          </div>
                          <div className="font-semibold text-primary">
                            ${sub.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptions
              .filter((sub) => {
                const billingDate = parseISO(sub.nextBillingDate);
                return isSameMonth(billingDate, currentDate);
              })
              .sort(
                (a, b) =>
                  new Date(a.nextBillingDate).getTime() -
                  new Date(b.nextBillingDate).getTime()
              )
              .map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.icon}</span>
                    <div>
                      <p className="font-semibold">{sub.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(sub.nextBillingDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-semibold">
                    ${sub.price}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
