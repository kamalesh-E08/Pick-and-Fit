"use client";
import Link from "next/link";
import Image from "next/image";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();

  return (
    <div className="container px-4 py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Link href="/shop">
            <Button>Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.map((item) => (
            <div
              key={`${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`}
              className="flex gap-4 items-center"
            >
              <div className="w-24 h-24 relative bg-gray-100 rounded-md overflow-hidden">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <div className="text-sm text-muted-foreground">
                  ₹{item.price.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    className="px-3 py-1 border"
                    onClick={() =>
                      updateQuantity(
                        `${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`,
                        item.quantity - 1,
                      )
                    }
                  >
                    -
                  </button>
                  <span className="px-4">{item.quantity}</span>
                  <button
                    className="px-3 py-1 border"
                    onClick={() =>
                      updateQuantity(
                        `${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`,
                        item.quantity + 1,
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="font-semibold">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    removeItem(
                      `${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`,
                    )
                  }
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <div className="text-muted-foreground">Subtotal</div>
              <div className="font-semibold text-lg">
                ₹{subtotal.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => clearCart()}>
                Clear Cart
              </Button>
              <Link href="/checkout">
                <Button>Proceed to Checkout</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
