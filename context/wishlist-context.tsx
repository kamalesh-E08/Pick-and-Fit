"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  image?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleItem: (item: WishlistItem) => Promise<void>;
  clearWishlist: () => Promise<void>;
  hasItem: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "pickfit_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY}:${user?.email || "guest"}`;
  const guestKey = `${STORAGE_KEY}:guest`;

  // Load wishlist on auth change
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (!user?.email) {
          // Load guest wishlist from localStorage
          const raw = localStorage.getItem(guestKey);
          const parsed = raw ? (JSON.parse(raw) as WishlistItem[]) : [];
          setItems(parsed);
          return;
        }

        // Try to load from database first
        try {
          const response = await fetch(`/api/wishlist?email=${user.email}`);
          if (response.ok) {
            const data = await response.json();
            if (data.wishlist?.items) {
              setItems(data.wishlist.items);
              localStorage.setItem(
                storageKey,
                JSON.stringify(data.wishlist.items),
              );
              return;
            }
          }
        } catch (error) {
          console.warn(
            "Failed to load wishlist from database, using localStorage",
          );
        }

        // Fallback to localStorage
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as WishlistItem[]) : [];

        // Check for guest wishlist to migrate
        const guestRaw = localStorage.getItem(guestKey);
        const guestItems = guestRaw
          ? (JSON.parse(guestRaw) as WishlistItem[])
          : [];

        if (guestItems.length > 0 && parsed.length === 0) {
          setItems(guestItems);
          localStorage.setItem(storageKey, JSON.stringify(guestItems));
          localStorage.removeItem(guestKey);
          // Save to database
          await saveWishlistToDatabase(user.email, guestItems);
        } else {
          setItems(parsed);
        }
      } catch (e) {
        console.error("Error loading wishlist:", e);
        setItems([]);
      }
    };

    loadWishlist();
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

  const saveWishlistToDatabase = async (
    email: string,
    wishlistItems: WishlistItem[],
  ) => {
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: wishlistItems,
        }),
      });
    } catch (error) {
      console.error("Error saving wishlist to database:", error);
    }
  };

  const addItem = async (item: WishlistItem) => {
    try {
      setIsLoading(true);
      setItems((prev) => {
        if (prev.find((p) => p.id === item.id)) return prev;
        return [...prev, item];
      });

      if (user?.email) {
        const updatedItems = items.find((p) => p.id === item.id)
          ? items
          : [...items, item];
        await saveWishlistToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      setIsLoading(true);
      const updatedItems = items.filter((p) => p.id !== id);
      setItems(updatedItems);

      if (user?.email) {
        await saveWishlistToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = async (item: WishlistItem) => {
    try {
      setIsLoading(true);
      const updatedItems = items.find((p) => p.id === item.id)
        ? items.filter((p) => p.id !== item.id)
        : [...items, item];

      setItems(updatedItems);

      if (user?.email) {
        await saveWishlistToDatabase(user.email, updatedItems);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearWishlist = async () => {
    try {
      setIsLoading(true);
      setItems([]);

      if (user?.email) {
        await fetch(`/api/wishlist?email=${user.email}`, {
          method: "DELETE",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasItem = (id: string) => items.some((p) => p.id === id);

  const wishlistCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount,
        isLoading,
        addItem,
        removeItem,
        toggleItem,
        clearWishlist,
        hasItem,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
