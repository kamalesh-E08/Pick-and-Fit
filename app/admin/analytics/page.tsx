"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Analytics {
  orderStats: Array<{ _id: string; count: number }>;
  revenueStats: { total: number; count: number };
  refundStats: Array<{ _id: string; count: number; amount: number }>;
  topProducts: Array<{ _id: string; count: number; revenue: number }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/admin/api/analytics?dateRange=${dateRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Order Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Orders by Status
              </h2>
              <div className="space-y-3">
                {analytics.orderStats.map((stat) => (
                  <div
                    key={stat._id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-600">
                      {stat._id || "Unknown"}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-64 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(stat.count / Math.max(...analytics.orderStats.map((s) => s.count))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 w-12">
                        {stat.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Revenue
                </h2>
                <p className="text-4xl font-bold text-green-600">
                  ₹{analytics.revenueStats?.total?.toLocaleString() || "0"}
                </p>
                <p className="text-gray-600 mt-2">
                  From {analytics.revenueStats?.count || 0} orders
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Refunds
                </h2>
                <p className="text-4xl font-bold text-orange-600">
                  ₹
                  {analytics.refundStats
                    ?.reduce((sum, r) => sum + (r.amount || 0), 0)
                    .toLocaleString() || "0"}
                </p>
                <p className="text-gray-600 mt-2">
                  {analytics.refundStats?.reduce(
                    (sum, r) => sum + (r.count || 0),
                    0,
                  ) || 0}{" "}
                  refund requests
                </p>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Top Selling Products
              </h2>
              <div className="space-y-3">
                {analytics.topProducts?.slice(0, 5).map((product, idx) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-600">
                      #{idx + 1} - Product {product._id}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700">
                        {product.count} sales
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{product.revenue?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-600">No product data available</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load analytics</p>
          </div>
        )}
      </main>
    </div>
  );
}
