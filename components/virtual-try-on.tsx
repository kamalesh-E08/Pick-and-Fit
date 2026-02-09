"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface VirtualTryOnProps {
  productId: string;
  productImage: string;
  productName: string;
  userPhotoId?: string;
}

export function VirtualTryOn({
  productId,
  productImage,
  productName,
  userPhotoId,
}: VirtualTryOnProps) {
  const [isActive, setIsActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userPhoto, setUserPhoto] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user's signup photo if available
  useEffect(() => {
    if (userPhotoId) {
      loadUserPhoto();
    }
  }, [userPhotoId]);

  const loadUserPhoto = async () => {
    try {
      const response = await fetch(
        `/api/get-user-photo?photoId=${userPhotoId}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => setUserPhoto(img);
        img.src = url;
      }
    } catch (error) {
      console.error("Error loading user photo:", error);
    }
  };

  const applyVirtualTryOn = () => {
    if (!canvasRef.current || !userPhoto) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setLoading(true);

    // Draw user's body
    canvas.width = 400;
    canvas.height = 500;
    ctx.drawImage(userPhoto, 0, 0, canvas.width, canvas.height);

    // Load and overlay garment
    const garment = new Image();
    garment.crossOrigin = "anonymous";

    garment.onload = () => {
      // Simple overlay: draw garment on upper body
      // In production, use pose detection to properly align garment
      const garmentWidth = canvas.width * 0.7;
      const garmentHeight = (garment.height / garment.width) * garmentWidth;
      const x = (canvas.width - garmentWidth) / 2;
      const y = canvas.height * 0.15;

      // Semi-transparent overlay for effect
      ctx.globalAlpha = 0.85;
      ctx.drawImage(garment, x, y, garmentWidth, garmentHeight);
      ctx.globalAlpha = 1.0;

      // Add effects
      addRealisticEffects(ctx, canvas);
      setLoading(false);
    };

    garment.onerror = () => {
      setLoading(false);
      console.error("Failed to load garment image");
    };

    garment.src = productImage;
  };

  const addRealisticEffects = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    // Add subtle shadow for depth
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.1);

    // Add lighting effect
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadResult = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${productName}-try-on.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  if (!userPhoto) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          📸 Upload a photo during signup to try on this item virtually!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Virtual Try-On
          </h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            ✨ AR Preview
          </span>
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="bg-gray-900 rounded-lg p-2">
              <canvas
                ref={canvasRef}
                className="w-full rounded border-2 border-purple-300"
              />
            </div>

            <p className="text-xs text-gray-600 italic">
              💡 Tip: This preview shows how {productName} looks on you! The
              more accurate your photo, the better the preview.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={applyVirtualTryOn}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Processing..." : "🔄 Refresh"}
              </Button>
              <Button
                onClick={downloadResult}
                variant="outline"
                className="flex-1"
              >
                📥 Download
              </Button>
              <Button
                onClick={() => setIsActive(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <img
              src={userPhoto.src}
              alt="Your photo"
              className="w-full h-48 object-cover rounded-lg border-2 border-purple-300"
            />

            <Button
              onClick={() => {
                setIsActive(true);
                setTimeout(applyVirtualTryOn, 100);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              ✨ Try On This Item
            </Button>

            <p className="text-xs text-gray-600">
              See how this item looks on you before you buy!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
