"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
} from "lucide-react";

interface TrackingEvent {
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered";
  timestamp: string;
  location?: string;
  description: string;
}

interface TrackingData {
  orderNumber: string;
  trackingNumber?: string;
  currentStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered";
  events: TrackingEvent[];
  estimatedDelivery?: string;
  lastUpdate: string;
}

const statusOrder = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Order Pending",
    color: "bg-gray-100 text-gray-800",
    icon: <ShoppingCart className="w-5 h-5" />,
  },
  confirmed: {
    label: "Order Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  processing: {
    label: "Processing",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Package className="w-5 h-5" />,
  },
  shipped: {
    label: "Shipped",
    color: "bg-indigo-100 text-indigo-800",
    icon: <Truck className="w-5 h-5" />,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
};

export default function OrderTrackingTimeline({
  trackingData,
}: {
  trackingData: TrackingData;
}) {
  const [completedStatuses, setCompletedStatuses] = useState<string[]>([]);

  useEffect(() => {
    const currentIndex = statusOrder.indexOf(trackingData.currentStatus);
    setCompletedStatuses(statusOrder.slice(0, currentIndex + 1));
  }, [trackingData.currentStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-lg">
                Order #{trackingData.orderNumber}
              </CardTitle>
              {trackingData.trackingNumber && (
                <p className="text-sm text-gray-600 mt-1">
                  Tracking: {trackingData.trackingNumber}
                </p>
              )}
            </div>
            <Badge className={statusConfig[trackingData.currentStatus].color}>
              {statusConfig[trackingData.currentStatus].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-600" />
              <div>
                <p className="text-gray-600">Last Updated</p>
                <p className="font-semibold">
                  {formatDate(trackingData.lastUpdate)}
                </p>
              </div>
            </div>
            {trackingData.estimatedDelivery && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-gray-600">Est. Delivery</p>
                  <p className="font-semibold">
                    {formatDate(trackingData.estimatedDelivery)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {statusOrder.map((status, index) => {
              const isCompleted = completedStatuses.includes(status);
              const event = trackingData.events.find(
                (e) => e.status === status,
              );
              const isCurrent = status === trackingData.currentStatus;

              return (
                <div key={status} className="flex gap-4">
                  {/* Timeline Dot & Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-green-500"
                          : isCurrent
                            ? "bg-blue-500"
                            : "bg-gray-300"
                      }`}
                    >
                      {isCompleted || isCurrent ? (
                        statusConfig[status].icon
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {index < statusOrder.length - 1 && (
                      <div
                        className={`w-1 h-12 ${
                          completedStatuses.includes(statusOrder[index + 1])
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="pb-6 flex-grow">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p
                          className={`font-semibold ${
                            isCompleted ? "text-green-700" : "text-gray-700"
                          }`}
                        >
                          {statusConfig[status].label}
                        </p>
                        {event?.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                        {event?.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      {event && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(event.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
