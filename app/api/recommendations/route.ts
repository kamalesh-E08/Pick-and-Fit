import { NextResponse } from "next/server";
import {
  getSimilarProducts,
  getPersonalized,
  getTopPopular,
  getBodyAwareRecommendations,
} from "@/lib/recommendations";
import { getProductById } from "@/lib/product-data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const k = parseInt(url.searchParams.get("k") || "4", 10);
  const type = url.searchParams.get("type") || "visual";
  const userId = url.searchParams.get("userId") || undefined;

  // Body metrics parameters for personalized recommendations
  const bodyType = url.searchParams.get("bodyType");
  const height = url.searchParams.get("height");
  const skinTone = url.searchParams.get("skinTone");
  const poseDetected = url.searchParams.get("poseDetected") === "true";

  let ids: string[] = [];

  // If body metrics are provided, use body-aware recommendations
  if (bodyType || height || skinTone) {
    ids = await getBodyAwareRecommendations(
      {
        bodyType: bodyType as any,
        height,
        skinTone,
        poseDetected,
      },
      k,
    );
  } else if (type === "personalized") {
    ids = await getPersonalized(productId || undefined, userId, k);
  } else if (type === "popular") {
    ids = await getTopPopular(k);
  } else if (productId) {
    ids = getSimilarProducts(productId, k);
  } else {
    ids = await getTopPopular(k);
  }

  const products = ids
    .map((id) => {
      try {
        return getProductById(id);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json({ recommendations: products });
}
