"use client";

import type React from "react";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Star,
  Truck,
  ArrowRight,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/context/cart-context";
import type { Product } from "@/lib/product-data";
import "../../../app/product-zoom.css";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoomModal, setShowZoomModal] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const zoomImageRef = useRef<HTMLImageElement>(null);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const openZoomModal = () => {
    setShowZoomModal(true);
  };

  const closeZoomModal = () => {
    setShowZoomModal(false);
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/diverse-products-still-life.png";
  };

  return (
    <div className="container px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="mb-4">
        <ol className="flex flex-wrap items-center text-xs">
          <li className="flex items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2 text-muted-foreground">/</span>
            <Link
              href="/shop"
              className="text-muted-foreground hover:text-foreground"
            >
              Shop
            </Link>
          </li>
          {product.gender && product.gender !== "beauty" && (
            <li className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <Link
                href={`/shop/${product.gender}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {product.gender.charAt(0).toUpperCase() +
                  product.gender.slice(1)}
              </Link>
            </li>
          )}
          {product.category && product.category !== "none" && (
            <li className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <Link
                href={`/shop/${product.gender}/${product.category}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {product.category
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Link>
            </li>
          )}
          <li className="flex items-center">
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="font-medium">{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Product Image */}
        <div className="relative">
          <div
            ref={imageRef}
            className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={openZoomModal}
          >
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              onError={handleImageError}
              priority
            />
            {isZoomed && (
              <div
                className="absolute inset-0 bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${product.image})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: "200%",
                }}
              ></div>
            )}
            <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full">
              <ZoomIn className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
            {product.originalPrice > product.price && (
              <span className="text-sm font-medium text-green-600">
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100,
                )}
                % off
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-4">
            {product.shortDescription}
          </p>

          {/* Brand and Material (if available) */}
          {product.brand && (
            <div className="mb-4">
              <span className="font-medium">Brand: </span>
              <span>{product.brand}</span>
            </div>
          )}

          {product.material && (
            <div className="mb-4">
              <span className="font-medium">Material: </span>
              <span>{product.material}</span>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-4 py-2 border rounded-md ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleSizeSelect(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Select Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`px-4 py-2 border rounded-md ${
                      selectedColor === color
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleColorSelect(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Quantity</h3>
            <div className="flex items-center border border-gray-300 rounded-md w-32">
              <button
                className="px-3 py-1 text-lg"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="flex-1 text-center">{quantity}</span>
              <button
                className="px-3 py-1 text-lg"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  quantity,
                  selectedColor: selectedColor ?? null,
                  selectedSize: selectedSize ?? null,
                  originalPrice: product.originalPrice,
                });
                toast({
                  title: "Added to cart",
                  description: `${product.name} added to cart.`,
                });
              }}
            >
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                toast({
                  title: "Added to wishlist",
                  description: `${product.name} saved to wishlist.`,
                });
              }}
            >
              <Heart className="h-5 w-5" />
              Add to Wishlist
            </Button>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Delivery Info */}
          {product.deliveryInfo && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Delivery Information</h4>
                  <p className="text-sm text-muted-foreground">
                    {product.deliveryInfo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Return Policy */}
          {product.returnPolicy && (
            <div className="mb-4">
              <h4 className="font-medium">Return Policy</h4>
              <p className="text-sm text-muted-foreground">
                {product.returnPolicy}
              </p>
            </div>
          )}

          {/* Product Description */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-3">Product Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Product Information */}
      {(product.features || product.careInstructions) && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Product Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="text-muted-foreground">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Care Instructions */}
            {product.careInstructions &&
              product.careInstructions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Care Instructions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {product.careInstructions.map((instruction, index) => (
                      <li key={index} className="text-muted-foreground">
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">You May Also Like</h2>
            <Link
              href="/shop"
              className="text-sm font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/product/${relatedProduct.id}`}
              >
                <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                  <div className="relative aspect-square">
                    <Image
                      src={relatedProduct.image || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium text-sm">
                        ₹{relatedProduct.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{relatedProduct.rating}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {showZoomModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeZoomModal}
        >
          <div className="relative max-w-4xl max-h-[80vh] overflow-hidden">
            <img
              ref={zoomImageRef}
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="max-w-full max-h-[80vh] object-contain"
              onError={handleImageError}
            />
            <button
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeZoomModal();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
