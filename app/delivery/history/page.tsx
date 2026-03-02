"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
} from "lucide-react";

interface HistoryItem {
  _id: string;
  orderId: {
    orderNumber: string;
    shippingAddress: {
      fullName: string;
      addressLine: string;
      city: string;
    };
  };
  status: string;
  estimatedDelivery: string;
  completedAt?: string;
  earnings: number;
  currentLocation: string;
}

export default function DeliveryHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    failedDeliveries: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchHistory();
    fetchStats();
  }, [page, statusFilter]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/delivery/api/history?page=${page}&status=${statusFilter}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/delivery/api/history/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "delivered") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const filteredHistory = history.filter((item) =>
    searchQuery
      ? item.orderId.orderNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.orderId.shippingAddress.fullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Delivery History
              </h1>
              <p className="text-gray-500 mt-1">
                View your past deliveries and earnings
              </p>
            </div>
            <Link
              href="/delivery"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Deliveries"
            value={stats.totalDeliveries}
            icon={Package}
            color="blue"
          />
          <StatCard
            label="Completed"
            value={stats.completedDeliveries}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Failed"
            value={stats.failedDeliveries}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString()}`}
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                No deliveries found
              </p>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Your delivery history will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">
                                #{item.orderId.orderNumber}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.currentLocation}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.orderId.shippingAddress.fullName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.orderId.shippingAddress.city}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {item.orderId.shippingAddress.addressLine.substring(
                              0,
                              30,
                            )}
                            ...
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {new Date(
                              item.completedAt || item.estimatedDelivery,
                            ).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}
                          >
                            {getStatusIcon(item.status)}
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{item.earnings}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/delivery/shipments/${item._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{page}</span> of{" "}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            setPage(Math.min(totalPages, page + 1))
                          }
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
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
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
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
      </div>
    </div>
  );
}
