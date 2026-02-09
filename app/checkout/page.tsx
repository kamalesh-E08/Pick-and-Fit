"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Truck,
  MapPin,
  Plus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

const paymentTypeLabels: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  const shippingFee = 99;
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + shippingFee + tax;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?from=checkout");
      return;
    }

    if (user) {
      fetchPaymentMethods();
    }
  }, [user, authLoading, router]);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/payment-methods?email=${encodeURIComponent(user?.email || "")}`,
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);

      // Auto-select default payment method
      const defaultMethod = data.methods?.find(
        (m: PaymentMethod) => m.isDefault,
      );
      if (defaultMethod) {
        setSelectedPaymentId(defaultMethod._id);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.phone
    ) {
      toast.error("Please fill in all shipping details");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const selectedMethod = paymentMethods.find(
        (method) => method._id === selectedPaymentId,
      );

      const paymentMethodType = selectedMethod
        ? selectedMethod.type === "paypal" ||
          selectedMethod.type === "apple_pay" ||
          selectedMethod.type === "google_pay"
          ? "wallet"
          : "card"
        : "card";

      const orderData = {
        userId: user?.id,
        userEmail: user?.email,
        items,
        subtotal,
        shippingCost: shippingFee,
        tax,
        total,
        paymentMethod: paymentMethodType,
        shippingAddress: {
          name: shippingAddress.fullName,
          street: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.postalCode,
          country: "India",
          phone: shippingAddress.phone,
        },
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const data = await response.json();
      const createdOrderId = data.order?.id || data.order?._id;

      if (!createdOrderId) {
        throw new Error("Order ID missing from response");
      }

      const pendingOrder = {
        orderId: createdOrderId,
        amount: total,
        subtotal,
        shippingFee,
        tax,
        items,
      };

      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
      toast.success("Order created. Redirecting to payment...");
      router.push(`/payment?orderId=${createdOrderId}&amount=${total}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to create order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container px-4 py-12 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container px-4 py-12 max-w-3xl">
        <div className="text-center py-20">
          <p className="text-gray-600 mb-4 text-lg">Your cart is empty.</p>
          <Link href="/shop">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Shipping & Payment */}
        <div className="md:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        address: e.target.value,
                      })
                    }
                    placeholder="123 Main Street, Apartment 4B"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value,
                      })
                    }
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        state: e.target.value,
                      })
                    }
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="400001"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
                <Link href="/payment-methods">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No payment methods saved</p>
                  <Link href="/payment-methods">
                    <Button>Add Payment Method</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method._id}
                      onClick={() => setSelectedPaymentId(method._id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentId === method._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">
                              {method.cardDetails?.brand
                                ? `${method.cardDetails.brand} •••• ${method.cardDetails.lastFour}`
                                : paymentTypeLabels[method.type] ||
                                  "Payment Method"}
                            </p>
                            {method.cardDetails && (
                              <p className="text-sm text-gray-600">
                                Expires {method.cardDetails.expiryMonth}/
                                {method.cardDetails.expiryYear}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedPaymentId === method._id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      {method.isDefault && (
                        <Badge className="mt-2" variant="secondary">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>₹{shippingFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full"
                size="lg"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>

              {/* Delivery Info */}
              <div className="flex items-start gap-2 text-sm text-gray-600 pt-4 border-t">
                <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Expected delivery in 3-5 business days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
