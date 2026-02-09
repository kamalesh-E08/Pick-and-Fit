"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/wishlist-context";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();

  return (
    <div className="container px-4 py-12 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
          <Link href="/shop">
            <Button>Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center">
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
                {item.price && (
                  <div className="text-sm text-muted-foreground">
                    ₹{item.price.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button variant="ghost" onClick={() => removeItem(item.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <div className="text-muted-foreground">Saved items</div>
              <div className="font-semibold text-lg">{items.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => clearWishlist()}>
                Clear Wishlist
              </Button>
              <Link href="/cart">
                <Button>Move to Cart</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
