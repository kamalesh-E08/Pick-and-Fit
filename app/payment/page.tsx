"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export const dynamic = "force-dynamic";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

declare global {
  interface Window {
    Stripe?: any;
  }
}

interface OrderData {
  orderId: string;
  amount: number;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  tryOnFee?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    tryOnFee?: number;
  }>;
}

export default function PaymentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [transactionId, setTransactionId] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  // Load Stripe.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => {
      setStripeReady(true);
    };
    script.onerror = () => {
      console.error("Failed to load Stripe script");
      toast.error("Failed to load payment gateway");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?from=payment");
      return;
    }

    // Get order data from localStorage or query params
    const storedOrder = localStorage.getItem("pendingOrder");
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const orderIdFromQuery = params?.get("orderId");
    const amountFromQuery = params?.get("amount");
    const success = params?.get("success") === "true";
    const sessionId = params?.get("session_id");
    const cancel = params?.get("cancel") === "true";

    if (storedOrder) {
      const parsed = JSON.parse(storedOrder);
      setOrderData({
        orderId: parsed.orderId,
        amount: parsed.total ?? parsed.amount,
        subtotal: parsed.subtotal,
        shippingFee: parsed.shippingFee,
        tax: parsed.tax,
        items: parsed.items || [],
      });
    } else if (orderIdFromQuery && amountFromQuery) {
      setOrderData({
        orderId: orderIdFromQuery,
        amount: parseFloat(amountFromQuery),
        items: [],
      });
    } else if (!success) {
      toast.error("No order information found");
      router.push("/cart");
      return;
    }

    if (success && sessionId && orderIdFromQuery) {
      verifyStripeCheckoutSession(sessionId, orderIdFromQuery);
    } else if (cancel) {
      toast.error("Payment was cancelled. Please try again.");
    }
  }, [authLoading, user, router]);

  /**
   * Create Stripe checkout session
   */
  const createStripeCheckoutSession = async (): Promise<string | null> => {
    try {
      if (!orderData) {
        toast.error("No order data available");
        return null;
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          currency: "INR",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment session");
      }

      return data.sessionId;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create payment session";
      console.error("Stripe session creation error:", error);
      toast.error(errorMessage);
      return null;
    }
  };

  const verifyStripeCheckoutSession = async (
    sessionId: string,
    orderId: string,
  ) => {
    try {
      setIsVerifyingSession(true);
      setPaymentStatus("processing");

      const response = await fetch(
        `/api/stripe/verify-checkout-session?sessionId=${encodeURIComponent(
          sessionId,
        )}&orderId=${encodeURIComponent(orderId)}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment verification failed");
      }

      setPaymentStatus("success");
      setTransactionId(result.paymentId || "");
      toast.success("Payment successful!");
      localStorage.removeItem("pendingOrder");
      clearCart();

      setTimeout(() => {
        router.push(`/track-order?orderId=${orderId}`);
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment verification failed";
      console.error("Stripe payment verification error:", error);
      setPaymentStatus("failed");
      toast.error(errorMessage);
    } finally {
      setIsVerifyingSession(false);
    }
  };

  const initiatePayment = async () => {
    if (!orderData || !stripeReady) {
      toast.error("Payment system not ready. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const sessionId = await createStripeCheckoutSession();
      if (!sessionId) {
        setIsProcessing(false);
        return;
      }

      const stripe = window.Stripe?.(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );
      if (!stripe) {
        throw new Error("Stripe.js is not available");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setIsProcessing(false);
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate payment",
      );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </h2>
            <p className="text-gray-600">
              Your payment has been processed successfully. Your order is being
              prepared for shipment.
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
              <div>
                <p className="text-gray-600">Order ID:</p>
                <p className="font-mono font-semibold text-gray-900">
                  {orderData?.orderId}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Transaction ID:</p>
                <p className="font-mono font-semibold text-gray-900">
                  {transactionId}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Amount Paid:</p>
                <p className="font-mono font-semibold text-gray-900">
                  ₹{orderData?.amount.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to order tracking...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
            <p className="text-gray-600">
              Unfortunately, your payment could not be processed. Please try
              again or use a different payment method.
            </p>
            <div className="bg-red-50 p-3 rounded text-sm">
              <p className="text-red-600">Order ID: {orderData?.orderId}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentStatus("idle");
                  setIsProcessing(false);
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/cart")}
                className="flex-1"
              >
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Complete Your Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!orderData && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    No order data found. Please go back to your cart.
                  </div>
                )}

                {!stripeReady && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                    Loading payment gateway...
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Order Details</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono font-semibold">
                        {orderData?.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold">
                        {orderData?.items.length || 0}
                      </span>
                    </div>
                    {orderData?.subtotal && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">
                          ₹{orderData.subtotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {orderData?.shippingFee && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-semibold">
                          ₹{orderData.shippingFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {orderData?.tax && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-semibold">
                          ₹{orderData.tax.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {orderData?.tryOnFee != null && orderData.tryOnFee > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Virtual Try-On Fee:</span>
                        <span className="font-semibold">
                          ₹{orderData.tryOnFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-blue-600">
                        ₹{orderData?.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Payment Information
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-blue-800">
                      💳 You will be redirected to Stripe's secure payment
                      gateway. We accept all major credit and debit cards.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={initiatePayment}
                  disabled={
                    isProcessing ||
                    isVerifyingSession ||
                    !stripeReady ||
                    !orderData ||
                    !user
                  }
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay ₹{orderData?.amount.toFixed(2) || "0.00"}
                    </>
                  )}
                </Button>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 text-center">
                    Your payment information is secure and encrypted. Pick and
                    Fit uses industry-standard security protocols.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Items</h4>
                  {orderData?.items && orderData.items.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {orderData.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between text-gray-600"
                        >
                          <span>
                            {item.name} x{item.quantity}
                          </span>
                          <span className="font-semibold">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No items available</p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      ₹{orderData?.subtotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">
                      ₹{orderData?.shippingFee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">
                      ₹{orderData?.tax?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {orderData?.tryOnFee != null && orderData.tryOnFee > 0 && (
                    <div className="flex justify-between text-sm text-blue-700">
                      <span>Try-On Fee:</span>
                      <span className="font-semibold">
                        ₹{orderData.tryOnFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      ₹{orderData?.amount.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                <Link href="/cart">
                  <Button variant="outline" size="sm" className="w-full">
                    Back to Cart
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
