"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Leaf, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewCount?: number;
  tags?: string[];
  category?: string;
  material?: string;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount = 0,
  tags = [],
  category,
  material,
}: ProductCardProps) {
  // Calculate discount percentage
  const discountPercentage = Math.round(
    ((originalPrice - price) / originalPrice) * 100,
  );

  // Check if product is eco-friendly (basic heuristic)
  const isEcoFriendly =
    material &&
    (material.toLowerCase().includes("organic") ||
      material.toLowerCase().includes("sustainable") ||
      material.toLowerCase().includes("recycled") ||
      material.toLowerCase().includes("cotton"));

  return (
    <Link href={`/product/${id}`}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <div className="relative aspect-square">
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          {discountPercentage > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
              {discountPercentage}% OFF
            </Badge>
          )}
          {tags.length > 0 && (
            <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0">
              {tags[0]}
            </Badge>
          )}
          {isEcoFriendly && (
            <Badge className="absolute bottom-2 right-2 bg-green-600 text-white border-0 flex items-center gap-1">
              <Leaf className="h-3 w-3" /> Eco
            </Badge>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium truncate">{name}</h3>
          <div className="flex items-center justify-between mt-1">
            <div>
              <span className="font-semibold">₹{price.toLocaleString()}</span>
              {originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{rating}</span>
            </div>
          </div>
          {category && (
            <div className="mt-1">
              <span className="text-xs text-muted-foreground capitalize">
                {category}
              </span>
            </div>
          )}
          <Link href={`/virtual-try-on?product=${id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 gap-1 text-xs"
              onClick={(e) => e.preventDefault()}
            >
              <Camera className="h-3 w-3" />
              Try On
            </Button>
          </Link>
        </div>
      </Card>
    </Link>
  );
}
