"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart } from "lucide-react";

export default function SellerDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
    }
  }, [router]);

  const menuItems = [
    {
      label: "My Products",
      href: "/seller/products",
      icon: Package,
      description: "Manage your product catalog and inventory",
    },
    {
      label: "My Orders",
      href: "/seller/orders",
      icon: ShoppingCart,
      description: "View orders that include your products",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your products and orders</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.label}
                    </h3>
                    <Icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
