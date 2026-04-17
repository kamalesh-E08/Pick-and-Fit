"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Package, Search, Truck } from "lucide-react";

interface ShipmentItem {
  _id: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  currentLocation?: string;
  shippingAddress: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
}

const STATUS_OPTIONS = [
  "active",
  "pending",
  "picked",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "all",
];

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DeliveryShipmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "active");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
    }
  }, [router]);

  useEffect(() => {
    setStatus(searchParams.get("status") || "active");
  }, [searchParams]);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `/delivery/api/shipments?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          setShipments([]);
          return;
        }

        const data = await response.json();
        setShipments(data.shipments || []);
      } catch (error) {
        console.error("Failed to fetch shipments:", error);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, [search, status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/delivery")}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Assigned Shipments
              </h1>
              <p className="text-gray-500 mt-1">
                Search, filter, and open shipments assigned to you
              </p>
            </div>
          </div>
          <Link
            href="/delivery/history"
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            View History
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by order number or tracking number"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading shipments...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                No shipments found
              </p>
              <p className="text-gray-500 mt-2">
                Try changing the filter or search query.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <div
                  key={shipment._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Order #{shipment.orderNumber}
                        </h2>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {formatStatus(shipment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tracking: {shipment.trackingNumber}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {shipment.shippingAddress.name || "Customer"}
                            </p>
                            <p>
                              {shipment.shippingAddress.street ||
                                "Address unavailable"}
                            </p>
                            <p>
                              {shipment.shippingAddress.city || ""}
                              {shipment.shippingAddress.state
                                ? `, ${shipment.shippingAddress.state}`
                                : ""}
                              {shipment.shippingAddress.zipCode
                                ? ` ${shipment.shippingAddress.zipCode}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              Est. Delivery:{" "}
                              {new Date(
                                shipment.estimatedDelivery,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span>
                              {shipment.currentLocation ||
                                "Location not updated yet"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {shipment.shippingAddress.phone && (
                        <a
                          href={`tel:${shipment.shippingAddress.phone}`}
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          Call
                        </a>
                      )}
                      <Link
                        href={`/delivery/shipments/${shipment._id}`}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Open Shipment
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DeliveryShipmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shipments...</p>
          </div>
        </div>
      }
    >
      <DeliveryShipmentsPageContent />
    </Suspense>
  );
}
