"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "@/lib/product-data";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  originalPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "pickfit_cart";

function itemKey(
  item: Pick<CartItem, "id" | "selectedSize" | "selectedColor">,
) {
  return `${item.id}::${item.selectedSize ?? ""}::${item.selectedColor ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const key = itemKey(item);
      const idx = prev.findIndex((p) => itemKey(p) === key);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + item.quantity,
        };
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeItem = (itemKeyStr: string) => {
    setItems((prev) => prev.filter((p) => itemKey(p) !== itemKeyStr));
  };

  const updateQuantity = (itemKeyStr: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          itemKey(p) === itemKeyStr
            ? { ...p, quantity: Math.max(1, quantity) }
            : p,
        )
        .filter(Boolean),
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
