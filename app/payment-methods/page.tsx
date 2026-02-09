"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  CreditCard,
  Trash2,
  Plus,
  Check,
  AlertCircle,
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
  paypalDetails?: {
    email: string;
  };
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

const paymentTypeLabels: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

const paymentTypeIcons: Record<string, string> = {
  credit_card: "💳",
  debit_card: "💳",
  paypal: "🅿️",
  apple_pay: "🍎",
  google_pay: "🔵",
};

export default function PaymentMethodsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "credit_card",
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?from=payment-methods");
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
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cardNumber || !formData.cardHolder) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      // Extract last 4 digits
      const lastFour = formData.cardNumber.slice(-4);
      const brand = determineBrand(formData.cardNumber);

      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          type: formData.type,
          cardDetails:
            formData.type === "credit_card" || formData.type === "debit_card"
              ? {
                  lastFour,
                  brand,
                  expiryMonth: parseInt(formData.expiryMonth),
                  expiryYear: parseInt(formData.expiryYear),
                  holderName: formData.cardHolder,
                }
              : null,
          isDefault: formData.isDefault,
        }),
      });

      if (!response.ok) throw new Error("Failed to add payment method");

      toast.success("Payment method added successfully!");
      setShowAddForm(false);
      setFormData({
        type: "credit_card",
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        isDefault: false,
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Add error:", error);
      toast.error("Failed to add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const determineBrand = (cardNumber: string): string => {
    const first = cardNumber[0];
    if (first === "4") return "Visa";
    if (first === "5") return "Mastercard";
    if (first === "3") return "Amex";
    return "Card";
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch("/api/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId,
          isDefault: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Default payment method updated!");
      fetchPaymentMethods();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update payment method");
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?"))
      return;

    try {
      const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Payment method deleted!");
      fetchPaymentMethods();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete payment method");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
        <p className="text-gray-600">Manage your payment methods and cards</p>
      </div>

      {/* Add Payment Method Section */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {(formData.type === "credit_card" ||
                formData.type === "debit_card") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        setFormData({
                          ...formData,
                          cardNumber: value.replace(/(\d{4})/g, "$1 ").trim(),
                        });
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={formData.cardHolder}
                      onChange={(e) =>
                        setFormData({ ...formData, cardHolder: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiry Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.expiryMonth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryMonth: e.target.value,
                          })
                        }
                        placeholder="MM"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expiry Year
                      </label>
                      <input
                        type="number"
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 20}
                        value={formData.expiryYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryYear: e.target.value,
                          })
                        }
                        placeholder="YYYY"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={formData.cvv}
                      onChange={(e) =>
                        setFormData({ ...formData, cvv: e.target.value })
                      }
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Set as default payment method</span>
              </label>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isSubmitting ? "Adding..." : "Add Payment Method"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 mb-4">No payment methods yet</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {!showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            )}

            {paymentMethods.map((method) => (
              <Card key={method._id} className="relative">
                {method.isDefault && (
                  <Badge className="absolute top-4 right-4 bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}

                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {paymentTypeIcons[method.type]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {paymentTypeLabels[method.type]}
                      </h3>

                      {method.cardDetails && (
                        <>
                          <p className="text-sm text-gray-600">
                            {method.cardDetails.brand} ending in{" "}
                            {method.cardDetails.lastFour}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Expires {method.cardDetails.expiryMonth}/
                            {method.cardDetails.expiryYear}
                          </p>
                        </>
                      )}

                      {method.paypalDetails && (
                        <p className="text-sm text-gray-600">
                          {method.paypalDetails.email}
                        </p>
                      )}

                      {!method.isVerified && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                          <AlertCircle className="w-3 h-3" />
                          Not verified
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Added {new Date(method.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!method.isDefault && (
                        <Button
                          onClick={() => setDefaultPaymentMethod(method._id)}
                          size="sm"
                          variant="outline"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        onClick={() => deletePaymentMethod(method._id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
