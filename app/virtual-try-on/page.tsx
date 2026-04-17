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
  Trash2,
  AlertCircle,
  User,
  Plus,
  X,
  ShoppingCart,
  Clock,
  Star,
  TrendingUp,
  Filter,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getAllProducts } from "@/lib/product-data";
import { generateRecommendations } from "@/lib/style-sense-ai";
import { StyleSenseRecommendations } from "@/components/style-sense-recommendations";
import { useCart } from "@/context/cart-context";

// --- Types ---

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
  profileGender?: string;
  profileAgeGroup?: string;
}

interface PhotoProfile {
  _id: string;
  personName: string;
  photoUrl: string;
  description: string;
  gender?: string;
  ageGroup?: string;
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
  kidGender?: string;
  rating: number;
}

interface ValidationErrors {
  personName?: string;
  gender?: string;
  ageGroup?: string;
  product?: string;
  photo?: string;
}

// --- Try-Before-Buy fee tiers ---

const TRY_ON_FEE_TIERS = [
  { maxHours: 24, fee: 49, label: "Fresh try-on (< 24h)" },
  { maxHours: 48, fee: 79, label: "Extended try-on (24-48h)" },
  { maxHours: 72, fee: 99, label: "Long trial (48-72h)" },
] as const;
const TRY_ON_BASE_FEE = 49;

function calculateTryOnFee(createdAt: string): {
  fee: number;
  hoursElapsed: number;
  label: string;
  creditNote: string;
} {
  const hoursElapsed = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / 3_600_000,
  );
  const tier = TRY_ON_FEE_TIERS.find((t) => hoursElapsed < t.maxHours);
  const fee = tier?.fee ?? TRY_ON_BASE_FEE;
  const label = tier?.label ?? "Standard try-on";
  return {
    fee,
    hoursElapsed,
    label,
    creditNote:
      "This fee is credited toward your purchase price if you keep the item.",
  };
}

// --- Gender-aware match analysis ---

function analyzeMatch(
  product: Product,
  profileGender: string,
  profileAgeGroup: string,
): { score: number; analysis: string[]; prediction: string } {
  const hash = [...`${product.id}${profileGender}`].reduce(
    (acc, c) => acc + c.charCodeAt(0),
    0,
  );
  let baseScore = 55 + (hash % 31);
  const analysis: string[] = [];

  const productGender = product.gender ?? "";
  const isGenderMatch =
    productGender === profileGender ||
    (profileGender === "kids" && productGender === "kids");

  if (isGenderMatch) {
    baseScore = Math.min(95, baseScore + 10);
    analysis.push("Correct gender-appropriate styling confirmed");
  } else if (productGender && profileGender) {
    baseScore = Math.max(40, baseScore - 12);
    analysis.push("Warning: Product designed for a different gender");
  }

  const cat = (product.category ?? "").toLowerCase();
  if (cat.includes("formal")) analysis.push("Formal-wear fit profile detected");
  else if (cat.includes("casual"))
    analysis.push("Casual-comfort profile scores high");
  else if (cat.includes("oversized"))
    analysis.push("Relaxed-fit aesthetic match");
  else if (cat.includes("beauty"))
    analysis.push("Skincare / beauty compatibility noted");

  if (profileGender === "kids" && profileAgeGroup) {
    const ageDelta =
      profileAgeGroup === "0-2"
        ? -5
        : profileAgeGroup === "3-5"
          ? 0
          : profileAgeGroup === "6-9"
            ? 5
            : 8;
    baseScore = Math.min(95, Math.max(40, baseScore + ageDelta));
    analysis.push(`Sized for ${profileAgeGroup} yrs age group`);
  }

  const prediction =
    baseScore >= 85
      ? "Excellent Fit - Highly recommended to buy"
      : baseScore >= 70
        ? "Good Fit - Likely a great match"
        : baseScore >= 55
          ? "Moderate Fit - Try with a size adjustment"
          : "Low Fit - Consider a different style";

  return { score: baseScore, analysis, prediction };
}

// --- Constants ---

const GENDER_OPTIONS = [
  { value: "men", label: "Men", ringClass: "border-blue-400 bg-blue-50" },
  { value: "women", label: "Women", ringClass: "border-pink-400 bg-pink-50" },
  { value: "kids", label: "Kids", ringClass: "border-green-400 bg-green-50" },
] as const;

const AGE_GROUPS = [
  { value: "0-2", label: "Toddler (0-2 yrs)", sub: "Baby & Toddler" },
  { value: "3-5", label: "Little Kids (3-5 yrs)", sub: "Preschool" },
  { value: "6-9", label: "Kids (6-9 yrs)", sub: "School Age" },
  { value: "10-14", label: "Tweens (10-14 yrs)", sub: "Pre-teen" },
] as const;

function genderLabel(gender?: string, ageGroup?: string) {
  if (!gender) return "";
  if (gender === "kids") return `Kids${ageGroup ? ` (${ageGroup}y)` : ""}`;
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function genderColorClass(gender?: string) {
  return gender === "men"
    ? "bg-blue-100 text-blue-700"
    : gender === "women"
      ? "bg-pink-100 text-pink-700"
      : gender === "kids"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-700";
}

// --- Main component ---

function VirtualTryOnContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

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
  const [isAddingToCart, setIsAddingToCart] = useState<string>("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPhotoProfile, setSelectedPhotoProfile] = useState("");
  const [personName, setPersonName] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileAgeGroup, setProfileAgeGroup] = useState("");
  const [showNewPhotoForm, setShowNewPhotoForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const [genderFilter, setGenderFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");

  const [feeModal, setFeeModal] = useState<{
    tryOn: TryOnSession;
    feeInfo: ReturnType<typeof calculateTryOnFee>;
  } | null>(null);

  useEffect(() => {
    const allProducts = getAllProducts();
    setProducts(allProducts as Product[]);
    const productParam = searchParams.get("product");
    if (productParam) setSelectedProduct(productParam);
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
      const v = videoRef.current;
      v.srcObject = cameraStreamRef.current;
      v.muted = true;
      v.playsInline = true;
      v.onloadedmetadata = () => v.play().catch(() => {});
      v.play().catch(() => {});
    }
  }, [cameraActive]);

  useEffect(() => {
    if (!selectedPhotoProfile) return;
    const profile = photoProfiles.find((p) => p._id === selectedPhotoProfile);
    if (profile?.gender) {
      setGenderFilter(profile.gender);
      setAgeFilter(profile.ageGroup ?? "");
    }
  }, [selectedPhotoProfile, photoProfiles]);

  // Filter products by the active profile's gender and, for kids, by kidGender sub-filter
  const filteredProducts = products.filter((p) => {
    if (!genderFilter) return true;
    if (p.gender !== genderFilter) return false;
    return true;
  });

  // Regenerate gender/age-specific AI recommendations whenever filters or try-on history change
  useEffect(() => {
    if (products.length === 0 || tryOns.length === 0) {
      setRecommendations([]);
      return;
    }
    // Use gender-filtered products so only relevant items are recommended
    const poolProducts = genderFilter
      ? products.filter((p) => p.gender === genderFilter)
      : products;
    const recs = generateRecommendations(
      poolProducts as any,
      tryOns.map((t: TryOnSession) => ({
        productId: t.productId,
        productName: t.productName,
      })),
      [tryOns[tryOns.length - 1]?.productId],
      4,
    );
    setRecommendations(recs);
  }, [genderFilter, ageFilter, tryOns, products]);

  const activeProfile = photoProfiles.find(
    (p) => p._id === selectedPhotoProfile,
  );

  const fetchPhotoProfiles = async () => {
    try {
      const res = await fetch(
        `/api/photo-profiles?email=${encodeURIComponent(user?.email ?? "")}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPhotoProfiles(data.profiles ?? []);
    } catch {
      console.error("Failed to fetch photo profiles");
    }
  };

  const fetchTryOns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/virtual-try-on?email=${encodeURIComponent(user?.email ?? "")}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTryOns(data.tryOns ?? []);
    } catch {
      toast.error("Failed to load try-on history");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhotoForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!personName.trim()) {
      errors.personName = "Person name is required";
    } else if (personName.trim().length < 2) {
      errors.personName = "Name must be at least 2 characters";
    } else if (personName.trim().length > 50) {
      errors.personName = "Name must be under 50 characters";
    }
    if (!profileGender) {
      errors.gender = "Please select a gender";
    }
    if (profileGender === "kids" && !profileAgeGroup) {
      errors.ageGroup = "Please select an age group for kids";
    }
    if (!previewUrl) {
      errors.photo = "Please capture or upload a photo first";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTryOnForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!previewUrl || !selectedPhotoProfile)
      errors.photo = "Please select a photo profile first";
    if (!selectedProduct) errors.product = "Please select a product to try on";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof ValidationErrors) =>
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10 MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
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
    } catch {
      toast.error("Failed to access camera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current?.videoWidth) {
      toast.error("Camera not ready. Please try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setSelectedFile(
          new File([blob], "capture.jpg", { type: "image/jpeg" }),
        );
        setPreviewUrl(canvas.toDataURL());
        setShowNewPhotoForm(true);
        stopCamera();
      }
    }, "image/jpeg");
  };

  const stopCamera = () => {
    (
      [
        videoRef.current?.srcObject as MediaStream,
        cameraStreamRef.current,
      ].filter(Boolean) as MediaStream[]
    ).forEach((s) => s.getTracks().forEach((t) => t.stop()));
    if (videoRef.current) videoRef.current.srcObject = null;
    cameraStreamRef.current = null;
    setCameraActive(false);
  };

  const savePhotoProfile = async () => {
    if (!validatePhotoForm()) return;
    try {
      const res = await fetch("/api/photo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          personName: personName.trim(),
          photoUrl: previewUrl,
          gender: profileGender,
          ageGroup: profileGender === "kids" ? profileAgeGroup : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Photo saved as "${personName.trim()}"`);
      setPhotoProfiles((prev) => [...prev, data.profile]);
      setSelectedPhotoProfile(data.profile._id);
      setShowNewPhotoForm(false);
      setPersonName("");
      setProfileGender("");
      setProfileAgeGroup("");
      setSelectedFile(null);
      setValidationErrors({});
    } catch {
      toast.error("Failed to save photo profile");
    }
  };

  const selectPhotoProfile = (profile: PhotoProfile) => {
    setSelectedPhotoProfile(profile._id);
    setPreviewUrl(profile.photoUrl);
    setPersonName(profile.personName);
    setProfileGender(profile.gender ?? "");
    setProfileAgeGroup(profile.ageGroup ?? "");
  };

  const deletePhotoProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/photo-profiles?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Photo profile deleted");
      setPhotoProfiles((prev) => prev.filter((p) => p._id !== id));
      if (selectedPhotoProfile === id) {
        setSelectedPhotoProfile("");
        setPreviewUrl("");
        setPersonName("");
        setProfileGender("");
        setProfileAgeGroup("");
      }
    } catch {
      toast.error("Failed to delete photo profile");
    }
  };

  const resetNewPhotoForm = () => {
    setShowNewPhotoForm(false);
    setPreviewUrl("");
    setPersonName("");
    setProfileGender("");
    setProfileAgeGroup("");
    setSelectedFile(null);
    setValidationErrors({});
  };

  const handleUploadTryOn = async () => {
    if (!validateTryOnForm()) return;
    try {
      setIsUploading(true);
      const prod = products.find((p) => p.id === selectedProduct);
      if (!prod) throw new Error("Product not found");
      const matchResult = analyzeMatch(
        prod,
        profileGender || genderFilter,
        profileAgeGroup || ageFilter,
      );
      const res = await fetch("/api/virtual-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          productId: selectedProduct,
          productName: prod.name,
          photoProfileId: selectedPhotoProfile,
          personName: personName.trim(),
          uploadedImageUrl: previewUrl,
          matchScore: matchResult.score,
          feedback: matchResult.prediction,
          profileGender: profileGender || genderFilter,
          profileAgeGroup: profileAgeGroup || ageFilter,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Upload failed (${res.status})`);
      }
      toast.success("Try-on recorded successfully!");
      setSelectedProduct("");
      fetchTryOns();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record try-on",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openFeeModal = (tryOn: TryOnSession) => {
    setFeeModal({ tryOn, feeInfo: calculateTryOnFee(tryOn.createdAt) });
  };

  const confirmAddToCart = async () => {
    if (!feeModal) return;
    const { tryOn, feeInfo } = feeModal;
    setIsAddingToCart(tryOn._id);
    setFeeModal(null);
    try {
      const prod = products.find((p) => p.id === tryOn.productId);
      await addItem({
        id: tryOn.productId,
        name: tryOn.productName,
        price: prod?.price ?? 0,
        image: prod?.image,
        quantity: 1,
        tryOnFee: feeInfo.fee,
        tryOnSessionId: tryOn._id,
      });
      toast.success(`Added to cart with Rs.${feeInfo.fee} virtual try-on fee`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart("");
    }
  };

  const deleteTryOn = async (id: string) => {
    try {
      const res = await fetch(`/api/virtual-try-on/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Try-on deleted");
      fetchTryOns();
    } catch {
      toast.error("Failed to delete try-on");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Try-Before-Buy Fee Modal */}
      {feeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Try-Before-You-Buy
              </CardTitle>
              <CardDescription>
                Adding this item includes a virtual try-on reservation fee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {feeModal.tryOn.productName}
                  </span>
                  <Badge className="bg-blue-600 text-white shrink-0">
                    {feeModal.feeInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {feeModal.feeInfo.hoursElapsed < 1
                    ? "Tried on less than 1 hour ago"
                    : `Tried on ${Math.floor(feeModal.feeInfo.hoursElapsed)}h ago`}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Price:</span>
                  <span className="font-semibold">
                    Rs.
                    {(
                      products.find((p) => p.id === feeModal.tryOn.productId)
                        ?.price ?? 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Virtual Try-On Fee:</span>
                  <span className="font-bold">+ Rs.{feeModal.feeInfo.fee}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Cart Total (this item):</span>
                  <span>
                    Rs.
                    {(
                      (products.find((p) => p.id === feeModal.tryOn.productId)
                        ?.price ?? 0) + feeModal.feeInfo.fee
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                {feeModal.feeInfo.creditNote}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={confirmAddToCart}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFeeModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-4xl font-bold">Virtual Try-On</h1>
          <Badge className="bg-purple-100 text-purple-700 text-sm px-3 py-1">
            Try Before You Buy
          </Badge>
        </div>
        <p className="text-gray-600">
          Upload a photo, pick a product, see the gender-specific match
          analysis, then add to cart with a time-based try-on fee.
        </p>
      </div>

      {/* Photo Library */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Photo Library
          </CardTitle>
          <CardDescription>
            Manage photos of different people. Gender and age guide product
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    {profile.gender && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${genderColorClass(profile.gender)}`}
                      >
                        {genderLabel(profile.gender, profile.ageGroup)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoProfile(profile._id);
                    }}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded p-0.5"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                  {selectedPhotoProfile === profile._id && (
                    <Badge className="absolute top-1 left-1 bg-blue-500 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showNewPhotoForm && !cameraActive && (
            <div className="flex gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" /> Add New Photo
              </Button>
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" /> Take Photo
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

          {showNewPhotoForm && previewUrl && (
            <div className="space-y-4 border-t pt-4">
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Person name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={personName}
                  maxLength={50}
                  onChange={(e) => {
                    setPersonName(e.target.value);
                    clearFieldError("personName");
                  }}
                  placeholder="e.g., John, Mom, Sister..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.personName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {validationErrors.personName && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.personName}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setProfileGender(opt.value);
                        if (opt.value !== "kids") setProfileAgeGroup("");
                        clearFieldError("gender");
                        clearFieldError("ageGroup");
                      }}
                      className={`py-2 px-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        profileGender === opt.value
                          ? opt.ringClass
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {validationErrors.gender && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.gender}
                  </p>
                )}
              </div>

              {/* Age group (kids only) */}
              {profileGender === "kids" && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Age Group <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map((ag) => (
                      <button
                        key={ag.value}
                        type="button"
                        onClick={() => {
                          setProfileAgeGroup(ag.value);
                          clearFieldError("ageGroup");
                        }}
                        className={`py-2 px-3 border-2 rounded-lg text-xs font-medium text-left transition-all ${
                          profileAgeGroup === ag.value
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold">{ag.label}</p>
                        <p className="text-gray-500 font-normal">{ag.sub}</p>
                      </button>
                    ))}
                  </div>
                  {validationErrors.ageGroup && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.ageGroup}
                    </p>
                  )}
                </div>
              )}

              {validationErrors.photo && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.photo}
                </p>
              )}

              <div className="flex gap-4">
                <Button onClick={savePhotoProfile} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Photo
                </Button>
                <Button
                  onClick={resetNewPhotoForm}
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

      {/* Try On Products */}
      {selectedPhotoProfile && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Try On Products
              </CardTitle>
              {activeProfile?.gender && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${genderColorClass(activeProfile.gender)}`}
                >
                  {genderLabel(activeProfile.gender, activeProfile.ageGroup)}
                </span>
              )}
            </div>
            <CardDescription>
              Trying on for: <strong>{personName}</strong>
              {activeProfile?.gender && (
                <span className="text-gray-500">
                  {" "}
                  — Showing{" "}
                  {genderLabel(
                    activeProfile.gender,
                    activeProfile.ageGroup,
                  )}{" "}
                  products
                </span>
              )}
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

            {/* Gender / age filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Filter:
              </span>
              {(["", "men", "women", "kids"] as const).map((g) => (
                <button
                  key={g || "all"}
                  onClick={() => {
                    setGenderFilter(g);
                    setAgeFilter("");
                  }}
                  className={`text-sm px-3 py-1 rounded-full border transition-all ${
                    genderFilter === g
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 hover:border-gray-400 text-gray-600"
                  }`}
                >
                  {g === ""
                    ? "All"
                    : g === "men"
                      ? "Men"
                      : g === "women"
                        ? "Women"
                        : "Kids"}
                </button>
              ))}
              {genderFilter === "kids" &&
                AGE_GROUPS.map((ag) => (
                  <button
                    key={ag.value}
                    onClick={() => setAgeFilter(ag.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      ageFilter === ag.value
                        ? "border-green-500 bg-green-50 text-green-700 font-medium"
                        : "border-gray-300 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    {ag.label}
                  </button>
                ))}
            </div>

            {/* Product select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Select Product to Try <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  clearFieldError("product");
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.product
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              >
                <option value="">
                  {filteredProducts.length > 0
                    ? `Choose from ${filteredProducts.length} ${genderFilter || "all"} products...`
                    : "No products match the current filter"}
                </option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — Rs.{product.price.toLocaleString()}
                    {product.category ? ` (${product.category})` : ""}
                  </option>
                ))}
              </select>
              {validationErrors.product && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.product}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {filteredProducts.length} products available for selected filter
              </p>
            </div>

            {/* Live match analysis */}
            {selectedProduct &&
              (() => {
                const prod = products.find((p) => p.id === selectedProduct);
                if (!prod) return null;
                const analysis = analyzeMatch(
                  prod,
                  profileGender || genderFilter,
                  profileAgeGroup || ageFilter,
                );
                return (
                  <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                    <div className="flex items-start gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{prod.name}</p>
                        <p className="text-xs text-gray-500">
                          Rs.{prod.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">{prod.rating}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-2xl font-bold ${
                            analysis.score >= 80
                              ? "text-green-600"
                              : analysis.score >= 65
                                ? "text-yellow-600"
                                : "text-orange-600"
                          }`}
                        >
                          {analysis.score}%
                        </div>
                        <div className="text-xs text-gray-500">
                          predicted match
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {analysis.analysis.map((a, i) => (
                        <p key={i} className="text-xs text-gray-600">
                          • {a}
                        </p>
                      ))}
                      <p
                        className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                          analysis.score >= 80
                            ? "text-green-700"
                            : analysis.score >= 65
                              ? "text-yellow-700"
                              : "text-orange-700"
                        }`}
                      >
                        <TrendingUp className="w-3 h-3" />
                        {analysis.prediction}
                      </p>
                    </div>
                  </div>
                );
              })()}

            {validationErrors.photo && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.photo}
              </p>
            )}

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
                Add a photo above and try on products
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tryOns.map((tryOn) => {
              const feeInfo = calculateTryOnFee(tryOn.createdAt);
              const matchColorClass =
                tryOn.matchScore >= 80
                  ? "text-green-700"
                  : tryOn.matchScore >= 65
                    ? "text-yellow-700"
                    : "text-orange-700";
              return (
                <Card key={tryOn._id} className="overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={tryOn.uploadedImageUrl}
                      alt={tryOn.productName}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-2 right-2 ${
                        tryOn.matchScore >= 80
                          ? "bg-green-500"
                          : tryOn.matchScore >= 65
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                      }`}
                    >
                      {tryOn.matchScore}% match
                    </Badge>
                    {tryOn.profileGender && (
                      <Badge
                        className={`absolute top-2 left-2 text-xs ${
                          tryOn.profileGender === "men"
                            ? "bg-blue-500"
                            : tryOn.profileGender === "women"
                              ? "bg-pink-500"
                              : "bg-green-500"
                        }`}
                      >
                        {genderLabel(
                          tryOn.profileGender,
                          tryOn.profileAgeGroup,
                        )}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-semibold text-sm">{tryOn.productName}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {tryOn.personName}
                    </p>
                    {tryOn.feedback && (
                      <p className={`text-xs font-medium ${matchColorClass}`}>
                        {tryOn.feedback}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(tryOn.createdAt).toLocaleDateString()} ·{" "}
                      {feeInfo.label}
                    </div>
                    <div className="flex items-center justify-between text-xs bg-blue-50 rounded px-2 py-1">
                      <span className="text-blue-700">Try-on fee:</span>
                      <span className="font-bold text-blue-700">
                        Rs.{feeInfo.fee}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/product/${tryOn.productId}?tryOnImage=${encodeURIComponent(tryOn.uploadedImageUrl)}&matchScore=${tryOn.matchScore}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Button
                        onClick={() => openFeeModal(tryOn)}
                        disabled={isAddingToCart === tryOn._id}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isAddingToCart === tryOn._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            +Rs.{feeInfo.fee}
                          </>
                        )}
                      </Button>
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
              );
            })}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
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
          <div className="h-8 w-56 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 w-full bg-gray-200 rounded-xl animate-pulse"
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
