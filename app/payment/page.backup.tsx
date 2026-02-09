"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface PaymentMethod {
  _id: string;
  type: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  cardDetails?: {
    lastFour: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
}

interface OrderData {
  orderId: string;
  amount: number;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"card" | "upi" | "netbanking">(
    "card",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  const [upiId, setUpiId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "failed"
  >("idle");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?from=payment");
      return;
    }

    // Get order data from localStorage or query params
    const storedOrder = localStorage.getItem("pendingOrder");
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
    } else {
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      if (orderId && amount) {
        setOrderData({
          orderId,
          amount: parseFloat(amount),
          items: [],
        });
      }
    }

    if (user) {
      fetchPaymentMethods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  useEffect(() => {
    if (paymentStatus === "success") {
      // Clear cart after successful payment
      // Note: clearCart is stable; it's safe to exclude from deps
      void clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(
        `/api/payment-methods?email=${encodeURIComponent(user?.email || "")}`,
      );

      if (!response.ok) throw new Error("Failed to fetch payment methods");

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);

      // Auto-select default method
      const defaultMethod = data.paymentMethods?.find(
        (m: PaymentMethod) =>
          m.isDefault && (m.type === "credit_card" || m.type === "debit_card"),
      );
      if (defaultMethod) {
        setSelectedMethod(defaultMethod._id);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length <= 16) {
      const formatted = value.replace(/(\d{4})/g, "$1 ").trim();
      setCardDetails({ ...cardDetails, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setCardDetails({ ...cardDetails, expiryDate: value });
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCardDetails({ ...cardDetails, cvv: value });
  };

  const validateCardDetails = (): boolean => {
    if (cardDetails.cardNumber.replace(/\s/g, "").length !== 16) {
      toast.error("Card number must be 16 digits");
      return false;
    }
    if (!cardDetails.cardHolder.trim()) {
      toast.error("Cardholder name is required");
      return false;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length !== 5) {
      toast.error("Expiry date must be MM/YY");
      return false;
    }
    if (cardDetails.cvv.length !== 3) {
      toast.error("CVV must be 3 digits");
      return false;
    }
    return true;
  };

  const validateUPI = (): boolean => {
    const upiPattern = /^[a-zA-Z0-9.-]{3,}@[a-zA-Z]{3,}$/;
    if (!upiPattern.test(upiId)) {
      toast.error("Invalid UPI ID format (e.g., username@bank)");
      return false;
    }
    return true;
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderData) {
      toast.error("No order data found");
      return;
    }

    // Validate payment details based on selected method
    if (paymentType === "card" && !selectedMethod) {
      if (!validateCardDetails()) return;
    } else if (paymentType === "upi") {
      if (!validateUPI()) return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      const response = await fetch("/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          amount: orderData.amount,
          paymentMethod: selectedMethod || paymentType,
          paymentType,
          cardDetails: paymentType === "card" ? cardDetails : undefined,
          upiId: paymentType === "upi" ? upiId : undefined,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus("success");
        setTransactionId(data.transactionId);
        toast.success("Payment processed successfully!");

        // Clear localStorage
        localStorage.removeItem("pendingOrder");

        // Redirect to order tracking after 2 seconds
        setTimeout(() => {
          router.push(`/track-order?orderId=${orderData.orderId}`);
        }, 2000);
      } else {
        setPaymentStatus("failed");
        toast.error(data.message || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      toast.error("An error occurred during payment processing");
    } finally {
      setIsProcessing(false);
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
              Your payment has been processed successfully.
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="text-gray-600">Transaction ID:</p>
              <p className="font-mono font-semibold text-gray-900">
                {transactionId}
              </p>
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
              Unfortunately, your payment could not be processed.
            </p>
            <Button onClick={() => setPaymentStatus("idle")} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/checkout">Back to Checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderData && (
                <>
                  {(() => {
                    const shipping = orderData.shippingFee ?? 99;
                    const tax =
                      orderData.tax ?? Math.round(orderData.amount * 0.18);
                    const subtotal =
                      orderData.subtotal ??
                      Math.max(orderData.amount - shipping - tax, 0);

                    return (
                      <>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Order ID</p>
                          <p className="font-semibold text-gray-900">
                            {orderData.orderId}
                          </p>
                        </div>
                        <div className="border-t pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="text-gray-900">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping</span>
                              <span className="text-gray-900">₹{shipping}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Tax (18% GST)
                              </span>
                              <span className="text-gray-900">₹{tax}</span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">
                              Total
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                              ₹{orderData.amount}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/payment-methods">Add Method</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  {["card", "upi", "netbanking"].map((method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={method}
                        checked={paymentType === method}
                        onChange={(e) =>
                          setPaymentType(
                            e.target.value as "card" | "upi" | "netbanking",
                          )
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium capitalize">
                        {method === "upi"
                          ? "UPI"
                          : method === "netbanking"
                            ? "Net Banking"
                            : "Credit/Debit Card"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <form onSubmit={processPayment} className="space-y-6 mt-6">
                {paymentType === "card" && (
                  <>
                    {/* Saved Cards */}
                    {paymentMethods.filter(
                      (method) =>
                        method.type === "credit_card" ||
                        method.type === "debit_card",
                    ).length > 0 && (
                      <div className="space-y-3">
                        <Label>Select Saved Card</Label>
                        <Select
                          value={selectedMethod}
                          onValueChange={setSelectedMethod}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a saved card" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods
                              .filter(
                                (method) =>
                                  method.type === "credit_card" ||
                                  method.type === "debit_card",
                              )
                              .map((method) => (
                                <SelectItem key={method._id} value={method._id}>
                                  {method.cardDetails?.brand || "Card"} ••••{" "}
                                  {method.cardDetails?.lastFour || ""}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(!selectedMethod || paymentMethods.length === 0) && (
                      <>
                        <div className="space-y-3">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardDetails.cardNumber}
                            onChange={handleCardNumberChange}
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="cardHolder">Cardholder Name</Label>
                          <Input
                            id="cardHolder"
                            placeholder="John Doe"
                            value={cardDetails.cardHolder}
                            onChange={(e) =>
                              setCardDetails({
                                ...cardDetails,
                                cardHolder: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              placeholder="MM/YY"
                              value={cardDetails.expiryDate}
                              onChange={handleExpiryChange}
                              maxLength="5"
                              required
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="password"
                              placeholder="123"
                              value={cardDetails.cvv}
                              onChange={handleCVVChange}
                              maxLength="3"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {paymentType === "upi" && (
                  <div className="space-y-3">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="username@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                  </div>
                )}

                {paymentType === "netbanking" && (
                  <div className="space-y-3">
                    <Label>Select Bank</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="icici">ICICI Bank</SelectItem>
                        <SelectItem value="hdfc">HDFC Bank</SelectItem>
                        <SelectItem value="sbi">State Bank of India</SelectItem>
                        <SelectItem value="axis">Axis Bank</SelectItem>
                        <SelectItem value="kotak">
                          Kotak Mahindra Bank
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${orderData?.amount || 0}`
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Your payment information is secure and encrypted.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
