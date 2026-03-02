"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  BarChart,
  Eye,
  Star,
} from "lucide-react";

interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  lowStockProducts: number;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/seller/api/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      label: "My Products",
      href: "/seller/products",
      icon: Package,
      description: "Manage your product catalog and inventory",
      color: "text-blue-600",
    },
    {
      label: "My Orders",
      href: "/seller/orders",
      icon: ShoppingCart,
      description: "View orders that include your products",
      color: "text-green-600",
    },
    {
      label: "Analytics",
      href: "/seller/analytics",
      icon: BarChart,
      description: "View sales analytics and performance metrics",
      color: "text-purple-600",
    },
    {
      label: "Reviews",
      href: "/seller/reviews",
      icon: Star,
      description: "Manage product reviews and ratings",
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your products, orders, and business performance
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Products"
              value={stats.totalProducts}
              icon={Package}
              color="blue"
              subtitle={`${stats.activeProducts} active`}
            />
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color="green"
              subtitle={`${stats.pendingOrders} pending`}
            />
            <StatCard
              label="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="purple"
              subtitle={`₹${stats.monthlyRevenue.toLocaleString()} this month`}
            />
            <StatCard
              label="Avg. Rating"
              value={stats.averageRating.toFixed(1)}
              icon={Star}
              color="yellow"
              subtitle={`${stats.lowStockProducts} low stock alerts`}
            />
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.label}
                    </h3>
                    <Icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Performance
            </h2>
            <div className="space-y-4">
              <InsightItem
                icon={TrendingUp}
                label="Sales Trend"
                value="↑ 12% this week"
                positive
              />
              <InsightItem
                icon={Eye}
                label="Product Views"
                value="2,453 views today"
                positive
              />
              <InsightItem
                icon={Star}
                label="Customer Rating"
                value={`${stats?.averageRating || 0}/5 stars`}
                positive={stats ? stats.averageRating >= 4 : false}
              />
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Alerts & Actions
            </h2>
            <div className="space-y-3">
              {stats && stats.lowStockProducts > 0 && (
                <AlertItem
                  type="warning"
                  message={`${stats.lowStockProducts} products are low on stock`}
                  action="Restock Now"
                  href="/seller/products?filter=low-stock"
                />
              )}
              {stats && stats.pendingOrders > 0 && (
                <AlertItem
                  type="info"
                  message={`${stats.pendingOrders} orders need processing`}
                  action="View Orders"
                  href="/seller/orders?status=pending"
                />
              )}
              <AlertItem
                type="success"
                message="All products are active and visible"
                action="View Products"
                href="/seller/products"
              />
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-3">
            💡 Seller Tips for Success
          </h3>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li>• Keep product descriptions detailed and accurate</li>
            <li>• Upload high-quality product images from multiple angles</li>
            <li>• Respond to customer inquiries within 24 hours</li>
            <li>• Monitor inventory levels to avoid stockouts</li>
            <li>• Regularly update product prices and promotions</li>
            <li>• Maintain a rating above 4.0 for better visibility</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Stats Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
    yellow: "text-yellow-600 bg-yellow-100",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Insight Item Component
function InsightItem({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-400" />
        <span className="text-gray-700">{label}</span>
      </div>
      <span
        className={`font-semibold ${positive ? "text-green-600" : "text-gray-600"}`}
      >
        {value}
      </span>
    </div>
  );
}

// Alert Item Component
function AlertItem({
  type,
  message,
  action,
  href,
}: {
  type: "warning" | "info" | "success";
  message: string;
  action: string;
  href: string;
}) {
  const typeStyles = {
    warning: "bg-orange-50 border-orange-200 text-orange-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };

  return (
    <div className={`border rounded-lg p-3 ${typeStyles[type]}`}>
      <p className="text-sm mb-2">{message}</p>
      <Link
        href={href}
        className="text-xs font-medium hover:underline inline-flex items-center gap-1"
      >
        {action} →
      </Link>
    </div>
  );
}
