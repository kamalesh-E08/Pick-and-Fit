"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Camera,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getAllProducts } from "@/lib/product-data";
import {
  generateRecommendations,
  calculateSustainabilityScore,
} from "@/lib/style-sense-ai";
import { StyleSenseRecommendations } from "@/components/style-sense-recommendations";

interface TryOnSession {
  _id: string;
  productId: string;
  productName: string;
  photoProfileId: string;
  personName: string;
  uploadedImageUrl: string;
  tryOnImageUrl?: string;
  matchScore: number;
  feedback: string;
  createdAt: string;
}

interface PhotoProfile {
  _id: string;
  personName: string;
  photoUrl: string;
  description: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  gender?: string;
  rating: number;
}

function VirtualTryOnContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [tryOns, setTryOns] = useState<TryOnSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [photoProfiles, setPhotoProfiles] = useState<PhotoProfile[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedPhotoProfile, setSelectedPhotoProfile] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [showNewPhotoForm, setShowNewPhotoForm] = useState(false);

  useEffect(() => {
    const allProducts = getAllProducts();
    setProducts(allProducts);

    const productParam = searchParams.get("product");
    if (productParam) {
      setSelectedProduct(productParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?from=virtual-try-on");
      return;
    }

    if (user) {
      fetchPhotoProfiles();
      fetchTryOns();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (cameraActive && videoRef.current && cameraStreamRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStreamRef.current;
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
      video.play().catch(() => {});
    }
  }, [cameraActive]);

  const fetchPhotoProfiles = async () => {
    try {
      const response = await fetch(
        `/api/photo-profiles?email=${encodeURIComponent(user?.email || "")}`,
      );
      if (!response.ok) throw new Error("Failed to fetch profiles");
      const data = await response.json();
      setPhotoProfiles(data.profiles || []);
    } catch (error) {
      console.error("Fetch profiles error:", error);
    }
  };

  const fetchTryOns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/virtual-try-on?email=${encodeURIComponent(user?.email || "")}`,
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setTryOns(data.tryOns || []);

      if (products.length > 0 && data.tryOns && data.tryOns.length > 0) {
        const recs = generateRecommendations(
          products,
          data.tryOns.map((t: TryOnSession) => ({
            productId: t.productId,
            productName: t.productName,
          })),
          [data.tryOns[data.tryOns.length - 1]?.productId],
          4,
        );
        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load try-on history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setShowNewPhotoForm(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      cameraStreamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      toast.error("Failed to access camera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        toast.error("Camera not ready yet. Please try again.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", {
              type: "image/jpeg",
            });
            setSelectedFile(file);
            setPreviewUrl(canvas.toDataURL());
            setShowNewPhotoForm(true);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const savePhotoProfile = async () => {
    if (!personName || !previewUrl) {
      toast.error("Please enter a name for this photo");
      return;
    }

    try {
      const response = await fetch("/api/photo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          personName,
          photoUrl: previewUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      toast.success(`Photo saved as "${personName}"`);

      setPhotoProfiles([...photoProfiles, data.profile]);
      setSelectedPhotoProfile(data.profile._id);
      setShowNewPhotoForm(false);
      setPersonName("");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save photo profile");
    }
  };

  const selectPhotoProfile = (profile: PhotoProfile) => {
    setSelectedPhotoProfile(profile._id);
    setPreviewUrl(profile.photoUrl);
    setPersonName(profile.personName);
  };

  const deletePhotoProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/photo-profiles?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Photo profile deleted");
      setPhotoProfiles(photoProfiles.filter((p) => p._id !== id));
      if (selectedPhotoProfile === id) {
        setSelectedPhotoProfile("");
        setPreviewUrl("");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete photo profile");
    }
  };

  const handleUploadTryOn = async () => {
    if (!previewUrl) {
      toast.error("Please capture or select a photo");
      return;
    }

    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (!selectedPhotoProfile) {
      toast.error("Please select a photo profile");
      return;
    }

    if (!personName.trim()) {
      toast.error("Please enter a person name for this capture");
      return;
    }

    try {
      setIsUploading(true);

      const selectedProductData = products.find(
        (p) => p.id === selectedProduct,
      );
      const productName = selectedProductData?.name || selectedProduct;

      const payload = {
        userId: user?.id,
        userEmail: user?.email,
        productId: selectedProduct,
        productName: productName,
        photoProfileId: selectedPhotoProfile,
        personName: personName.trim(),
        uploadedImageUrl: previewUrl,
        matchScore: Math.floor(Math.random() * 40) + 60,
        feedback: "",
      };

      console.log("Sending try-on payload:", {
        ...payload,
        uploadedImageUrl: `${previewUrl.substring(0, 50)}...`,
      });

      const response = await fetch("/api/virtual-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", {
          status: response.status,
          error: errorData.error,
          received: Object.keys(payload),
        });
        throw new Error(
          errorData.error || `Upload failed (${response.status})`,
        );
      }

      const data = await response.json();
      console.log("Upload success:", data);

      toast.success("Try-on uploaded successfully!");
      setSelectedProduct("");
      fetchTryOns();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload try-on";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteTryOn = async (id: string) => {
    try {
      const response = await fetch(`/api/virtual-try-on/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Try-on deleted");
      fetchTryOns();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete try-on");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Virtual Try-On</h1>
        <p className="text-gray-600">Upload photos and see how products look</p>
      </div>

      {/* Photo Library Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Photo Library
          </CardTitle>
          <CardDescription>
            Manage photos of different people to try on products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Photo Profiles */}
          {photoProfiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    selectedPhotoProfile === profile._id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => selectPhotoProfile(profile)}
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={profile.photoUrl}
                      alt={profile.personName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium truncate">
                      {profile.personName}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoProfile(profile._id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                  {selectedPhotoProfile === profile._id && (
                    <Badge className="absolute top-1 left-1 bg-blue-500">
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Photo Button */}
          {!showNewPhotoForm && !cameraActive && (
            <div className="flex gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Photo
              </Button>
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Camera View */}
          {cameraActive && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <div className="flex gap-4">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* New Photo Form */}
          {showNewPhotoForm && previewUrl && (
            <div className="space-y-4 border-t pt-4">
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Person Name</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g., John, Mom, Sister, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={savePhotoProfile} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Photo
                </Button>
                <Button
                  onClick={() => {
                    setShowNewPhotoForm(false);
                    setPreviewUrl("");
                    setPersonName("");
                    setSelectedFile(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Try On Section */}
      {selectedPhotoProfile && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Try On Products
            </CardTitle>
            <CardDescription>
              Trying on for: <strong>{personName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt={personName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Select Product to Try
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} {product.category && `(${product.category})`}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleUploadTryOn}
              disabled={isUploading || !selectedProduct}
              className="w-full"
            >
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isUploading ? "Processing..." : "Try It On"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Try-On History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Try-On History</h2>

        {tryOns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No try-ons yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Add a photo and try on products
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tryOns.map((tryOn) => (
              <Card key={tryOn._id} className="overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={tryOn.uploadedImageUrl}
                    alt={tryOn.productName}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={
                      tryOn.matchScore >= 70
                        ? "absolute top-2 right-2 bg-green-500"
                        : tryOn.matchScore >= 50
                          ? "absolute top-2 right-2 bg-yellow-500"
                          : "absolute top-2 right-2 bg-orange-500"
                    }
                  >
                    {tryOn.matchScore}% match
                  </Badge>
                </div>
                <CardContent className="pt-4">
                  <p className="font-semibold">{tryOn.productName}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {tryOn.personName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tryOn.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    {tryOn.matchScore >= 70 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span>
                      {tryOn.matchScore >= 70 ? "Great match!" : "Fair match"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/product/${tryOn.productId}?tryOnImage=${encodeURIComponent(tryOn.uploadedImageUrl)}&matchScore=${tryOn.matchScore}`}
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full">
                        View Product
                      </Button>
                    </Link>
                    <Button
                      onClick={() => deleteTryOn(tryOn._id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* StyleSense AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-12 mb-8">
          <StyleSenseRecommendations
            recommendations={recommendations}
            onProductSelect={(productId) => setSelectedProduct(productId)}
          />
        </div>
      )}
    </div>
  );
}

export default function VirtualTryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 w-full bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <VirtualTryOnContent />
    </Suspense>
  );
}
