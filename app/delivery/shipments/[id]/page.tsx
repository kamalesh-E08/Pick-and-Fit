"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Package,
  MapPin,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  ArrowLeft,
  Truck,
  Home,
} from "lucide-react";

interface ShipmentDetails {
  _id: string;
  orderId: {
    _id: string;
    orderNumber: string;
    shippingAddress: {
      fullName: string;
      phone: string;
      addressLine: string;
      city: string;
      state: string;
      pincode: string;
    };
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
  };
  status: string;
  estimatedDelivery: string;
  currentLocation: string;
  trackingEvents: Array<{
    status: string;
    location: string;
    timestamp: Date;
    note: string;
  }>;
  deliveryProof?: string;
}

export default function ShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params?.id as string;

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [note, setNote] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }

    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/delivery/api/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShipment(data.shipment);
        setNewLocation(data.shipment.currentLocation || "");
      }
    } catch (error) {
      console.error("Failed to fetch shipment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      alert("Unable to access camera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setProofImage(imageData);
        stopCamera();
        setShowCamera(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!shipmentId) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("accessToken");
      const payload: any = {
        shipmentId,
        status,
      };

      if (newLocation) payload.currentLocation = newLocation;
      if (note) payload.note = note;
      if (status === "delivered" && proofImage) {
        payload.deliveryProof = proofImage;
      }

      const response = await fetch("/delivery/api/shipments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Status updated successfully!");
        fetchShipmentDetails();
        setNote("");
        setProofImage(null);
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      "in-transit": "bg-blue-100 text-blue-800 border-blue-300",
      "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
      delivered: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Shipment Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The shipment you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => router.push("/delivery")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/delivery")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Shipment Details
            </h1>
            <p className="text-sm text-gray-500">
              Order #{shipment.orderId.orderNumber}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Shipment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Current Status</h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(shipment.status)}`}
                >
                  {shipment.status.replace("-", " ").toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Current Location</p>
                    <p className="font-medium">{shipment.currentLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Est. Delivery</p>
                    <p className="font-medium">
                      {new Date(
                        shipment.estimatedDelivery,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Delivery Address
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-lg">
                  {shipment.orderId.shippingAddress.fullName}
                </p>
                <p className="text-gray-700">
                  {shipment.orderId.shippingAddress.addressLine}
                </p>
                <p className="text-gray-700">
                  {shipment.orderId.shippingAddress.city},{" "}
                  {shipment.orderId.shippingAddress.state} -{" "}
                  {shipment.orderId.shippingAddress.pincode}
                </p>
                <div className="flex gap-4 mt-4">
                  <a
                    href={`tel:${shipment.orderId.shippingAddress.phone}`}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {shipment.orderId.shippingAddress.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-3">
                {shipment.orderId.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">₹{item.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Tracking History</h2>
              <div className="space-y-4">
                {shipment.trackingEvents.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      ></div>
                      {index < shipment.trackingEvents.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold">
                        {event.status.replace("-", " ").toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.note && (
                        <p className="text-sm text-gray-700 mt-1">
                          Note: {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Update Status */}
            {shipment.status !== "delivered" &&
              shipment.status !== "failed" && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Update Status</h2>

                  <div className="space-y-4">
                    {/* Location Update */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Current Location
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter location"
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Add any notes"
                      />
                    </div>

                    {/* Delivery Proof (for delivered status) */}
                    {shipment.status === "out-for-delivery" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Delivery Proof
                        </label>
                        {proofImage ? (
                          <div className="relative">
                            <img
                              src={proofImage}
                              alt="Delivery proof"
                              className="w-full rounded-lg border"
                            />
                            <button
                              onClick={() => setProofImage(null)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                            >
                              ×
                            </button>
                          </div>
                        ) : showCamera ? (
                          <div>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full rounded-lg border"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={capturePhoto}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
                              >
                                Capture
                              </button>
                              <button
                                onClick={() => {
                                  stopCamera();
                                  setShowCamera(false);
                                }}
                                className="flex-1 bg-gray-300 py-2 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={startCamera}
                              className="flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              <Camera className="w-4 h-4" />
                              Camera
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              <Upload className="w-4 h-4" />
                              Upload
                            </button>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {shipment.status === "pending" && (
                        <button
                          onClick={() => handleStatusUpdate("in-transit")}
                          disabled={updating}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Truck className="w-5 h-5" />
                          Start Transit
                        </button>
                      )}

                      {shipment.status === "in-transit" && (
                        <button
                          onClick={() => handleStatusUpdate("out-for-delivery")}
                          disabled={updating}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Package className="w-5 h-5" />
                          Out for Delivery
                        </button>
                      )}

                      {shipment.status === "out-for-delivery" && (
                        <button
                          onClick={() => handleStatusUpdate("delivered")}
                          disabled={updating || !proofImage}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Mark Delivered
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusUpdate("failed")}
                        disabled={updating}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-5 h-5" />
                        Mark Failed
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href={`tel:${shipment.orderId.shippingAddress.phone}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Call Customer</span>
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${shipment.orderId.shippingAddress.addressLine}, ${shipment.orderId.shippingAddress.city}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>Open in Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
