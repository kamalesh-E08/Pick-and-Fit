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
  Bell,
  X,
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

interface SellerNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  orderDate: string;
  customerName: string;
  itemCount: number;
  sellerTotal: number;
  title: string;
  message: string;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchStats();
    fetchNotifications();

    const poll = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(poll);
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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/seller/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      const nextNotifications: SellerNotification[] = data.notifications || [];
      setNotifications(nextNotifications);

      const lastSeen = localStorage.getItem("seller_notifications_last_seen");
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const unread = nextNotifications.filter(
        (item) => new Date(item.orderDate).getTime() > lastSeenTime,
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markNotificationsAsSeen = () => {
    localStorage.setItem(
      "seller_notifications_last_seen",
      new Date().toISOString(),
    );
    setUnreadCount(0);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-background/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your products, orders, and business performance
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next) {
                    markNotificationsAsSeen();
                  }
                }}
                className="relative p-2 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[360px] bg-card border border-border rounded-lg shadow-lg z-30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold text-foreground">
                      New Orders
                    </h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded hover:bg-muted/60"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                        No order notifications yet
                      </p>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={`/seller/orders`}
                          className="block px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/40"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {item.customerName} •{" "}
                            {new Date(item.orderDate).toLocaleString()}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                className="bg-card rounded-lg border border-border p-6 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
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
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.label}
                    </h3>
                    <Icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Performance */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
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
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
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
        <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-3">
            💡 Seller Tips for Success
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
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
    <div className="bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
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
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </div>
      <span
        className={`font-semibold ${positive ? "text-green-600" : "text-muted-foreground"}`}
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
