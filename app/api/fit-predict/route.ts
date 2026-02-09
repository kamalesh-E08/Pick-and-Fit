import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/product-data";

interface FitPredictRequest {
  height: number; // cm
  weight: number; // kg
  productId: string;
  pastSize?: string; // user's previous size (S, M, L, XL, etc.)
}

interface FitPredictResponse {
  recommendedSize: string;
  confidence: number; // 0-1
  reasoning: string;
  availableSizes: string[];
}

/**
 * Simple fit prediction model
 * Maps height/weight to clothing size with confidence score
 *
 * This is a demo implementation. In production, you'd use:
 * - Historical return data from your database
 * - Real ML model trained on user fit history
 * - Brand/category-specific size charts
 */
function predictFitSize(
  height: number,
  weight: number,
  pastSize?: string,
): { size: string; confidence: number; reasoning: string } {
  // BMI-based basic sizing (simplified)
  const bmi = weight / (height / 100) ** 2;

  let sizeByMeasure: string;
  let reason: string;

  if (height < 160) {
    sizeByMeasure = "XS";
    reason = "Petite frame (height < 160cm)";
  } else if (height < 170) {
    sizeByMeasure = "S";
    reason = "Small frame (160-170cm)";
  } else if (height < 180) {
    sizeByMeasure = "M";
    reason = "Medium frame (170-180cm)";
  } else if (height < 190) {
    sizeByMeasure = "L";
    reason = "Large frame (180-190cm)";
  } else {
    sizeByMeasure = "XL";
    reason = "Extra large frame (190cm+)";
  }

  // Adjust based on weight/BMI
  if (bmi < 18.5) {
    // Underweight
    const prevSize = sizeByMeasure;
    sizeByMeasure =
      sizeByMeasure === "XS"
        ? "XS"
        : String.fromCharCode(sizeByMeasure.charCodeAt(0) - 1);
    reason = `${reason}. Lower BMI (${bmi.toFixed(1)}) suggests ${sizeByMeasure}`;
  } else if (bmi > 28) {
    // Overweight
    const prevSize = sizeByMeasure;
    sizeByMeasure =
      sizeByMeasure === "XL"
        ? "XXL"
        : String.fromCharCode(sizeByMeasure.charCodeAt(0) + 1);
    reason = `${reason}. Higher BMI (${bmi.toFixed(1)}) suggests ${sizeByMeasure}`;
  }

  // Boost confidence if user has size history
  let confidence = 0.75;
  if (pastSize && pastSize === sizeByMeasure) {
    confidence = 0.92;
    reason += ". Matches your previous size preference";
  } else if (pastSize) {
    confidence = 0.68;
    reason += `. Differs from your previous size (${pastSize})`;
  }

  return {
    size: sizeByMeasure,
    confidence,
    reasoning: reason,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FitPredictRequest = await request.json();

    // Validate input
    const { height, weight, productId, pastSize } = body;

    if (!height || !weight || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: height, weight, productId" },
        { status: 400 },
      );
    }

    if (height < 100 || height > 250) {
      return NextResponse.json(
        { error: "Height must be between 100 and 250 cm" },
        { status: 400 },
      );
    }

    if (weight < 20 || weight > 200) {
      return NextResponse.json(
        { error: "Weight must be between 20 and 200 kg" },
        { status: 400 },
      );
    }

    // Get product to check available sizes
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${productId} not found` },
        { status: 404 },
      );
    }

    // Predict size
    const prediction = predictFitSize(height, weight, pastSize);

    // Default available sizes if not specified in product
    const availableSizes = product.sizes || ["XS", "S", "M", "L", "XL", "XXL"];

    // Ensure recommended size is available
    let recommendedSize = prediction.size;
    if (!availableSizes.includes(recommendedSize)) {
      // Find closest available size
      const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
      const targetIndex = sizeOrder.indexOf(recommendedSize);
      const availableIndices = availableSizes
        .map((s) => sizeOrder.indexOf(s))
        .filter((i) => i !== -1)
        .sort((a, b) => a - b);

      // Find closest index
      const closest = availableIndices.reduce((prev, curr) =>
        Math.abs(curr - targetIndex) < Math.abs(prev - targetIndex)
          ? curr
          : prev,
      );
      recommendedSize = sizeOrder[closest];
      prediction.reasoning += `. Adjusted to available size ${recommendedSize}`;
    }

    const response: FitPredictResponse = {
      recommendedSize,
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,
      availableSizes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fit prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to get available sizes for a product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId query parameter required" },
        { status: 400 },
      );
    }

    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${productId} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      productId,
      productName: product.name,
      availableSizes: product.sizes || ["XS", "S", "M", "L", "XL", "XXL"],
    });
  } catch (error) {
    console.error("Error fetching product sizes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
