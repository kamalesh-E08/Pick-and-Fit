"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Navigation,
} from "lucide-react";

interface DeliveryStats {
  todayDeliveries: number;
  pendingPickups: number;
  inTransit: number;
  completedToday: number;
  totalEarnings: number;
  rating: number;
}

interface Shipment {
  _id: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const [statsRes, shipmentsRes] = await Promise.all([
        fetch("/delivery/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/delivery/api/shipments?status=active", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (shipmentsRes.ok) {
        const shipmentsData = await shipmentsRes.json();
        setActiveShipments(shipmentsData.shipments || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pending Pickup",
        className: "bg-yellow-100 text-yellow-800",
      },
      picked: { label: "Picked Up", className: "bg-blue-100 text-blue-800" },
      in_transit: {
        label: "In Transit",
        className: "bg-purple-100 text-purple-800",
      },
      out_for_delivery: {
        label: "Out for Delivery",
        className: "bg-orange-100 text-orange-800",
      },
      delivered: {
        label: "Delivered",
        className: "bg-green-100 text-green-800",
      },
    };

    const { label, className } = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Delivery Partner Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your deliveries and track earnings
              </p>
            </div>
            <Link
              href="/delivery/route-optimizer"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Optimize Route
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Today's Deliveries"
              value={stats.todayDeliveries}
              icon={Package}
              color="blue"
              subtitle={`${stats.completedToday} completed`}
            />
            <StatCard
              label="Pending Pickups"
              value={stats.pendingPickups}
              icon={Clock}
              color="yellow"
              subtitle="Waiting for collection"
            />
            <StatCard
              label="In Transit"
              value={stats.inTransit}
              icon={TrendingUp}
              color="purple"
              subtitle="On the way"
            />
            <StatCard
              label="Today's Earnings"
              value={`₹${stats.totalEarnings.toLocaleString()}`}
              icon={DollarSign}
              color="green"
              subtitle={`Rating: ${stats.rating}/5`}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/delivery/shipments">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Shipments
                </h3>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 text-sm">
                View and manage all your assigned deliveries
              </p>
            </div>
          </Link>

          <Link href="/delivery/history">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery History
                </h3>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">
                View past deliveries and performance
              </p>
            </div>
          </Link>

          <Link href="/delivery/earnings">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Earnings
                </h3>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 text-sm">
                Track your earnings and payment history
              </p>
            </div>
          </Link>
        </div>

        {/* Active Shipments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Active Shipments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Shipments requiring your attention
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading shipments...</p>
            </div>
          ) : activeShipments.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active shipments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeShipments.map((shipment) => (
                <div
                  key={shipment._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Order #{shipment.orderNumber}
                        </h3>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Tracking: {shipment.trackingNumber}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {shipment.shippingAddress.name}
                            </p>
                            <p className="text-gray-600">
                              {shipment.shippingAddress.street},{" "}
                              {shipment.shippingAddress.city}
                            </p>
                            <p className="text-gray-600">
                              {shipment.shippingAddress.state} -{" "}
                              {shipment.shippingAddress.zipCode}
                            </p>
                            <p className="text-gray-600">
                              Phone: {shipment.shippingAddress.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            Est. Delivery:{" "}
                            {new Date(
                              shipment.estimatedDelivery,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/delivery/shipments/${shipment._id}`}
                      className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Delivery Tips
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Always verify recipient identity before delivery</li>
                <li>• Take clear photos as delivery proof</li>
                <li>• Update shipment status in real-time</li>
                <li>• Contact customer for delivery instructions if needed</li>
                <li>• Handle packages with care to maintain ratings</li>
              </ul>
            </div>
          </div>
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
    red: "text-red-600 bg-red-100",
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
