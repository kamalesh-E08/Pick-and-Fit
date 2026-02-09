"use client";

import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PaymentButton() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const shippingFee = 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingFee + tax;

  const handlePayment = async () => {
    if (!user) {
      router.push("/signin?from=payment");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Store order data in localStorage for payment page
      const orderData = {
        items,
        subtotal,
        shippingFee,
        tax,
        total,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("pendingOrder", JSON.stringify(orderData));

      // Navigate to payment page
      router.push(`/payment?amount=${total}`);
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing || items.length === 0}
      className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        `Proceed to Payment ₹${total}`
      )}
    </Button>
  );
}
