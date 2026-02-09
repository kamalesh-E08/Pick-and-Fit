"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface FitPredictResponse {
  recommendedSize: string;
  confidence: number;
  reasoning: string;
  availableSizes: string[];
}

interface SizeRecommendationProps {
  productId: string;
}

export function SizeRecommendation({ productId }: SizeRecommendationProps) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<FitPredictResponse | null>(null);
  const [error, setError] = useState("");

  async function handleGetRecommendation(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPrediction(null);

    if (!height || !weight) {
      setError("Please enter both height and weight");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/fit-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          height: parseInt(height),
          weight: parseInt(weight),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get recommendation");
      }

      const data: FitPredictResponse = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error fetching recommendation",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Size Finder</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            AI Powered
          </span>
        </div>

        <form onSubmit={handleGetRecommendation} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <Input
                type="number"
                min="100"
                max="250"
                placeholder="e.g. 170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={loading}
                className="border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <Input
                type="number"
                min="20"
                max="200"
                placeholder="e.g. 65"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={loading}
                className="border-gray-300"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !height || !weight}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? "Finding your size..." : "Get Size Recommendation"}
          </Button>
        </form>

        {prediction && (
          <div className="space-y-3 border-t pt-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Recommended Size</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">
                  {prediction.recommendedSize}
                </span>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg">
              <p className="text-sm text-gray-700">{prediction.reasoning}</p>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {prediction.availableSizes.map((size) => (
                <button
                  key={size}
                  className={`py-2 rounded font-semibold text-sm transition ${
                    size === prediction.recommendedSize
                      ? "bg-blue-600 text-white ring-2 ring-blue-400"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-600 italic">
              💡 Tip: Our AI considers your height, weight, and body
              proportions. If this differs from your usual size, you might
              prefer a different fit!
            </p>
          </div>
        )}

        {!prediction && (
          <div className="p-3 bg-blue-100 rounded text-sm text-blue-700">
            📏 Enter your measurements to get a personalized size recommendation
          </div>
        )}
      </div>
    </Card>
  );
}
