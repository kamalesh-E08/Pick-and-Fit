"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export const dynamic = "force-dynamic";
import OrderTrackingTimeline from "@/components/order-tracking-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface TrackingData {
  orderNumber: string;
  trackingNumber?: string;
  currentStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered";
  events: Array<{
    status: string;
    timestamp: string;
    location?: string;
    description: string;
  }>;
  estimatedDelivery?: string;
  lastUpdate: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items?: Array<{
    productName: string;
    quantity: number;
  }>;
}

export default function TrackOrderPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [orderId, setOrderId] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("orderId") || "";
      setOrderId(id);
      setSearchInput(id);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchTrackingData(orderId);
    }
  }, [orderId]);

  const fetchTrackingData = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const response = await fetch(
        `/api/track-order?orderId=${encodeURIComponent(id)}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        throw new Error("Failed to fetch tracking data");
      }

      const data = await response.json();
      setTrackingData(data.tracking);
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Failed to load tracking information");
      toast.error("Error loading tracking data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setOrderId(searchInput.trim());
      fetchTrackingData(searchInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-gray-600">
            Monitor your delivery status in real-time
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter Order ID (e.g., ORD-20240209-123456)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-grow"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-900">
                    Order Not Found
                  </h3>
                  <p className="text-red-800 text-sm">
                    We couldn't find an order with ID "{searchInput}". Please
                    check the order ID and try again.
                  </p>
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href="/orders">View Your Orders</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900">{error}</h3>
                  <p className="text-red-800 text-sm mt-1">
                    Please try again later or contact support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {trackingData && (
          <div className="space-y-6">
            {/* Tracking Timeline */}
            <OrderTrackingTimeline trackingData={trackingData} />

            {/* Additional Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              {trackingData.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-semibold">
                      {trackingData.shippingAddress.name}
                    </p>
                    <p className="text-gray-600">
                      {trackingData.shippingAddress.street}
                    </p>
                    <p className="text-gray-600">
                      {trackingData.shippingAddress.city},{" "}
                      {trackingData.shippingAddress.state}{" "}
                      {trackingData.shippingAddress.zipCode}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              {trackingData.items && trackingData.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Items in Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {trackingData.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm border-b pb-2 last:border-b-0"
                        >
                          <span className="text-gray-700">
                            {item.productName}
                          </span>
                          <span className="text-gray-600">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact Support */}
            {trackingData.currentStatus !== "delivered" && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-700 mb-4">
                    Having issues with your delivery? We're here to help!
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-blue-300"
                    >
                      <Link href="/contact-us">Contact Support</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <a href="tel:+918001234567">Call Us</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Shopping */}
            {trackingData.currentStatus === "delivered" && (
              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
              >
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            )}
          </div>
        )}

        {!isLoading && !trackingData && !error && !notFound && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6 text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                Enter an order ID to track your delivery
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-700">
              <strong>Where to find your Order ID:</strong> Check your
              confirmation email or visit your orders page to find your order
              ID.
            </p>
            <p className="text-gray-700">
              <strong>Tracking Updates:</strong> Delivery status updates may
              take up to 2 hours to reflect after shipment updates.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/orders">View All Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
