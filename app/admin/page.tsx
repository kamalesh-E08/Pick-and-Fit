"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Settings,
} from "lucide-react";

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  totalProducts: number;
  pendingRefunds: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/admin/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract basic stats from analytics
        setStats({
          totalOrders:
            data.data.orderStats?.reduce(
              (sum: number, s: any) => sum + s.count,
              0,
            ) || 0,
          totalRevenue: data.data.revenueStats?.total || 0,
          activeOrders: 0, // Will be calculated
          totalProducts: 0, // Will be fetched separately
          pendingRefunds:
            data.data.refundStats?.find((r: any) => r._id === "pending")
              ?.count || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      label: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      label: "Products",
      href: "/admin/products",
      icon: Package,
      color: "text-green-600",
    },
    {
      label: "Refunds",
      href: "/admin/refunds",
      icon: AlertCircle,
      color: "text-orange-600",
    },
    {
      label: "Shipments",
      href: "/admin/shipments",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      color: "text-red-600",
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: BarChart,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your e-commerce platform
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color="blue"
            />
            <StatCard
              label="Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              label="Active Orders"
              value={stats.activeOrders}
              icon={TrendingUp}
              color="purple"
            />
            <StatCard
              label="Products"
              value={stats.totalProducts}
              icon={Package}
              color="orange"
            />
            <StatCard
              label="Pending Refunds"
              value={stats.pendingRefunds}
              icon={AlertCircle}
              color="red"
            />
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item) => {
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
                  <p className="text-gray-600 text-sm">
                    Manage {item.label.toLowerCase()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <ActivityLog event="New order created" time="5 minutes ago" />
            <ActivityLog event="Shipment updated" time="1 hour ago" />
            <ActivityLog event="Refund request received" time="2 hours ago" />
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof ShoppingCart;
  color: "blue" | "green" | "purple" | "orange" | "red";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div
        className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

interface ActivityLogProps {
  event: string;
  time: string;
}

function ActivityLog({ event, time }: ActivityLogProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <p className="text-gray-700">{event}</p>
      <p className="text-gray-500 text-sm">{time}</p>
    </div>
  );
}
