"use client";

import { Leaf, Star, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import type { Recommendation } from "@/lib/style-sense-ai";

interface StyleSenseRecommendationsProps {
  recommendations: Recommendation[];
  onProductSelect?: (productId: string) => void;
}

export function StyleSenseRecommendations({
  recommendations,
  onProductSelect,
}: StyleSenseRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold">StyleSense AI Recommendations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card
            key={rec.product.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100 overflow-hidden">
              <img
                src={rec.product.image || "/placeholder.svg"}
                alt={rec.product.name}
                className="w-full h-full object-cover"
              />

              {/* Overall Score Badge */}
              <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-lg px-3 py-1 font-bold text-lg">
                {rec.overallScore}%
              </div>

              {/* Sustainable Badge */}
              {rec.sustainabilityScore >= 60 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  <Leaf className="h-3 w-3" />
                  Eco-Friendly
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">
                {rec.product.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Score Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Style Match</span>
                  <span className="font-semibold text-blue-600">
                    {rec.styleScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${rec.styleScore}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm mt-3">
                  <span className="text-gray-600">Sustainability</span>
                  <span className="font-semibold text-green-600">
                    {rec.sustainabilityScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${rec.sustainabilityScore}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm mt-3">
                  <span className="text-gray-600">Complements</span>
                  <span className="font-semibold text-purple-600">
                    {rec.complementaryScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${rec.complementaryScore}%` }}
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="font-semibold">
                    ₹{rec.product.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{rec.product.rating}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/virtual-try-on?product=${rec.product.id}`}
                className="block w-full"
              >
                <Button
                  className="w-full gap-2"
                  onClick={() => onProductSelect?.(rec.product.id)}
                >
                  <Zap className="h-4 w-4" />
                  Try This On
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
