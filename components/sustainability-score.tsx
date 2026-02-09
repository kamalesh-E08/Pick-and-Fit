import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplet, Zap } from "lucide-react";

interface SustainabilityScoreProps {
  productId: string;
  material?: string;
  brand?: string;
  category?: string;
}

/**
 * Calculates sustainability score based on:
 * - Material type (organic cotton = high, polyester = low)
 * - Brand reputation (eco-conscious brands get bonus)
 * - Product category (basics = more sustainable than fast fashion)
 */
function calculateSustainabilityScore(
  material?: string,
  brand?: string,
  category?: string,
): {
  score: number;
  breakdown: { water: number; carbon: number; waste: number };
} {
  let score = 50; // Base score

  // Material scoring (0-30 points)
  if (material) {
    const materialLower = material.toLowerCase();
    if (
      materialLower.includes("organic cotton") ||
      materialLower.includes("linen") ||
      materialLower.includes("hemp")
    ) {
      score += 25;
    } else if (
      materialLower.includes("cotton") ||
      materialLower.includes("wool")
    ) {
      score += 15;
    } else if (
      materialLower.includes("polyester") ||
      materialLower.includes("nylon") ||
      materialLower.includes("acrylic")
    ) {
      score += 5;
    } else if (
      materialLower.includes("recycled") ||
      materialLower.includes("sustainable")
    ) {
      score += 30;
    }
  }

  // Brand scoring (0-20 points)
  if (brand) {
    const ecoFriendlyBrands = [
      "patagonia",
      "everlane",
      "reformation",
      "veja",
      "allbirds",
      "eileen fisher",
    ];
    if (ecoFriendlyBrands.some((b) => brand.toLowerCase().includes(b))) {
      score += 20;
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Calculate breakdown
  const breakdown = {
    water: Math.max(50 - score / 2, 10),
    carbon: Math.max(60 - score / 1.5, 10),
    waste: Math.max(40 - score / 2.5, 10),
  };

  return { score, breakdown };
}

function getSustainabilityLabel(score: number): string {
  if (score >= 80) return "Eco Hero 🌿";
  if (score >= 60) return "Green Choice ✨";
  if (score >= 40) return "Moderate Impact 🌍";
  return "High Impact ⚠️";
}

function getSustainabilityColor(score: number): string {
  if (score >= 80) return "bg-green-100 border-green-300";
  if (score >= 60) return "bg-lime-100 border-lime-300";
  if (score >= 40) return "bg-yellow-100 border-yellow-300";
  return "bg-orange-100 border-orange-300";
}

export function SustainabilityScore({
  material = "Cotton",
  brand = "",
  category = "",
}: SustainabilityScoreProps) {
  const { score, breakdown } = calculateSustainabilityScore(
    material,
    brand,
    category,
  );

  return (
    <Card className={`p-4 border-2 ${getSustainabilityColor(score)}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Sustainability Score</h4>
          <Badge variant="outline" className="bg-white">
            {score}/100
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              score >= 80
                ? "bg-green-500"
                : score >= 60
                  ? "bg-lime-500"
                  : score >= 40
                    ? "bg-yellow-500"
                    : "bg-orange-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-gray-700">
          {getSustainabilityLabel(score)}
        </p>

        {/* Impact breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white/60 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Droplet className="h-3 w-3 text-blue-600" />
              <span className="font-semibold">Water</span>
            </div>
            <p className="text-gray-700">
              {breakdown.water.toFixed(0)}% impact
            </p>
          </div>

          <div className="bg-white/60 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-yellow-600" />
              <span className="font-semibold">Carbon</span>
            </div>
            <p className="text-gray-700">
              {breakdown.carbon.toFixed(0)}% impact
            </p>
          </div>

          <div className="bg-white/60 p-2 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Leaf className="h-3 w-3 text-green-600" />
              <span className="font-semibold">Waste</span>
            </div>
            <p className="text-gray-700">
              {breakdown.waste.toFixed(0)}% impact
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white/70 p-2 rounded text-xs text-gray-700">
          <p className="font-semibold mb-1">💡 Eco Tip:</p>
          {score >= 80 ? (
            <p>
              Great choice! This item is made with sustainable materials. 🌱
            </p>
          ) : score >= 60 ? (
            <p>Good choice! Consider pairing with eco-friendly items.</p>
          ) : (
            <p>
              Consider looking at alternatives with lower environmental impact.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
