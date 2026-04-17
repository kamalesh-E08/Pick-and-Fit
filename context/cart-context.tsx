"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "@/lib/product-data";
import { useAuth } from "@/context/auth-context";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  originalPrice?: number;
  tryOnFee?: number;
  tryOnSessionId?: string;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (itemKey: string) => Promise<void>;
  updateQuantity: (itemKey: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY}:${user?.email || "guest"}`;
  const guestKey = `${STORAGE_KEY}:guest`;

  // Load cart on auth change
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (!user?.email) {
          // Load guest cart from localStorage
          const raw = localStorage.getItem(guestKey);
          const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
          setItems(parsed);
          return;
        }

        // Try to load from database first
        try {
          const response = await fetch(`/api/cart?email=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            if (data.cart?.items) {
              setItems(data.cart.items);
              localStorage.setItem(storageKey, JSON.stringify(data.cart.items));
              return;
            }
          }
        } catch (error) {
          console.warn("Failed to load cart from database, using localStorage");
        }

        // Fallback to localStorage
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];

        // Check for guest cart to migrate
        const guestRaw = localStorage.getItem(guestKey);
        const guestItems = guestRaw ? (JSON.parse(guestRaw) as CartItem[]) : [];

        if (guestItems.length > 0 && parsed.length === 0) {
          setItems(guestItems);
          localStorage.setItem(storageKey, JSON.stringify(guestItems));
          localStorage.removeItem(guestKey);
          // Save to database
          await saveCartToDatabase(user.email, guestItems);
        } else {
          setItems(parsed);
        }
      } catch (e) {
        console.error("Error loading cart:", e);
        setItems([]);
      }
    };

    loadCart();
  }, [user?.email, storageKey, guestKey]);

  // Sync to localStorage on change
  useEffect(() => {
    try {
      if (user?.email) {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } else {
        localStorage.setItem(guestKey, JSON.stringify(items));
      }
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  }, [items, storageKey, guestKey, user?.email]);

  const saveCartToDatabase = async (email: string, cartItems: CartItem[]) => {
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: cartItems,
        }),
      });
    } catch (error) {
      console.error("Error saving cart to database:", error);
    }
  };

  const addItem = async (item: CartItem) => {
    try {
      setIsLoading(true);
      const key = itemKey(item);
      const idx = items.findIndex((p) => itemKey(p) === key);

      let updatedItems: CartItem[];
      if (idx > -1) {
        updatedItems = [...items];
        updatedItems[idx] = {
          ...updatedItems[idx],
          quantity: updatedItems[idx].quantity + item.quantity,
        };
      } else {
        updatedItems = [...items, item];
      }

      setItems(updatedItems);

      // Save to database if logged in
      if (user?.email) {
        await saveCartToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemKeyStr: string) => {
    try {
      setIsLoading(true);
      const updatedItems = items.filter((p) => itemKey(p) !== itemKeyStr);
      setItems(updatedItems);

      if (user?.email) {
        await saveCartToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemKeyStr: string, quantity: number) => {
    try {
      setIsLoading(true);
      const updatedItems = items
        .map((p) =>
          itemKey(p) === itemKeyStr
            ? { ...p, quantity: Math.max(1, quantity) }
            : p,
        )
        .filter(Boolean);

      setItems(updatedItems);

      if (user?.email) {
        await saveCartToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      setItems([]);

      if (user?.email) {
        await fetch(`/api/cart?email=${user.email}`, {
          method: "DELETE",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce(
    (s, i) => s + i.price * i.quantity + (i.tryOnFee ?? 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        subtotal,
        isLoading,
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
