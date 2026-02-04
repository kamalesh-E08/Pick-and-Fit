"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();

  const handlePlaceOrder = () => {
    // For Phase 2: create a mock order and clear cart
    alert("Order placed successfully (mock)");
    clearCart();
  };

  return (
    <div className="container px-4 py-12 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Link href="/shop">
            <Button>Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="border p-4 rounded-md">
            <h2 className="font-medium">Order Summary</h2>
            <div className="mt-2">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    {i.name} x {i.quantity}
                  </div>
                  <div>₹{(i.price * i.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="font-semibold">Subtotal</div>
              <div className="font-semibold">₹{subtotal.toLocaleString()}</div>
            </div>
          </div>

          <div>
            <Button onClick={handlePlaceOrder}>Place Order (Mock)</Button>
          </div>
        </div>
      )}
    </div>
  );
}
