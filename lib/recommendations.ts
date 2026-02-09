import fs from "fs";
import path from "path";

let sampleEmbeddings: Record<string, number[]> = {};
const samplePath = path.join(process.cwd(), "lib", "sample-embeddings.json");
const embeddingsPath = path.join(process.cwd(), "lib", "embeddings.json");

if (fs.existsSync(embeddingsPath)) {
  try {
    sampleEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8"));
  } catch (e) {
    sampleEmbeddings = {};
  }
} else if (fs.existsSync(samplePath)) {
  try {
    sampleEmbeddings = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
  } catch (e) {
    sampleEmbeddings = {};
  }
}

function dot(a: number[], b: number[]) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function magnitude(a: number[]) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

export function cosineSimilarity(a: number[], b: number[]) {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

export function getSimilarProducts(productId: string, k = 4): string[] {
  const ids = Object.keys(sampleEmbeddings);
  const target = sampleEmbeddings[productId];
  if (!target) return [];

  const scores = ids
    .filter((id) => id !== productId)
    .map((id) => ({
      id,
      score: cosineSimilarity(target, sampleEmbeddings[id]),
    }))
    .sort((a, b) => b.score - a.score);

  return scores.slice(0, k).map((s) => s.id);
}

export async function getTopPopular(k = 6) {
  // Try to load events from MongoDB
  let events: any[] = [];
  try {
    const { findEvents } = await import("@/lib/mongodb");
    if (findEvents && typeof (findEvents as any) === "function") {
      events = await (findEvents as any)();
    }
  } catch (e) {
    const eventsFile = path.join(process.cwd(), ".data", "events.json");
    if (fs.existsSync(eventsFile)) {
      try {
        events = JSON.parse(fs.readFileSync(eventsFile, "utf-8"));
      } catch (e) {
        events = [];
      }
    }
  }

  const scores: Record<string, number> = {};
  events.forEach((ev) => {
    const pid = ev.payload?.productId;
    if (!pid) return;
    if (ev.type === "purchase") scores[pid] = (scores[pid] || 0) + 4;
    if (ev.type === "add_to_cart") scores[pid] = (scores[pid] || 0) + 1;
    if (ev.type === "add_to_wishlist") scores[pid] = (scores[pid] || 0) + 0.5;
    if (ev.type === "view_product") scores[pid] = (scores[pid] || 0) + 0.1;
  });

  return Object.keys(scores)
    .map((id) => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.id);
}

export async function getPersonalized(
  productId?: string,
  userId?: string,
  k = 6,
) {
  // If productId given, use visual candidates else fallback to popular products
  const candidates = productId
    ? getSimilarProducts(productId, 100)
    : Object.keys(sampleEmbeddings);

  // load events (from MongoDB if available, otherwise file)
  let events: any[] = [];
  try {
    const { findEvents } = await import("@/lib/mongodb");
    if (findEvents && typeof (findEvents as any) === "function") {
      events = await (findEvents as any)();
    }
  } catch (e) {
    const eventsFile = path.join(process.cwd(), ".data", "events.json");
    if (fs.existsSync(eventsFile)) {
      try {
        events = JSON.parse(fs.readFileSync(eventsFile, "utf-8"));
      } catch (e) {
        events = [];
      }
    }
  }

  // user-specific signals
  const userEvents = userId
    ? events.filter((e) => e.payload?.userId === userId)
    : [];
  const userPrefs: Record<string, number> = {};
  userEvents.forEach((ev) => {
    const pid = ev.payload?.productId;
    if (!pid) return;
    if (ev.type === "purchase") userPrefs[pid] = (userPrefs[pid] || 0) + 2;
    if (ev.type === "add_to_cart") userPrefs[pid] = (userPrefs[pid] || 0) + 0.5;
    if (ev.type === "add_to_wishlist")
      userPrefs[pid] = (userPrefs[pid] || 0) + 0.3;
  });

  // global popularity
  const pop: Record<string, number> = {};
  events.forEach((ev) => {
    const pid = ev.payload?.productId;
    if (!pid) return;
    if (ev.type === "purchase") pop[pid] = (pop[pid] || 0) + 1;
    if (ev.type === "add_to_cart") pop[pid] = (pop[pid] || 0) + 0.25;
    if (ev.type === "add_to_wishlist") pop[pid] = (pop[pid] || 0) + 0.1;
  });

  const alpha = 1.0;
  const beta = 0.1;

  const scored = candidates
    .map((pid) => {
      const visScore =
        productId && sampleEmbeddings[productId] && sampleEmbeddings[pid]
          ? cosineSimilarity(sampleEmbeddings[productId], sampleEmbeddings[pid])
          : 0;
      const up = userPrefs[pid] || 0;
      const gp = pop[pid] || 0;
      const score = visScore * (1 + alpha * up) + beta * gp;
      return { id: pid, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((s) => s.id);
}

/**
 * Body-aware recommendations based on user's physical characteristics
 * Recommends products that complement body type, height, and skin tone
 */
export async function getBodyAwareRecommendations(
  bodyMetrics: {
    bodyType?: string;
    height?: string;
    skinTone?: string;
    poseDetected?: boolean;
  },
  k = 6,
): Promise<string[]> {
  const allProducts = Object.keys(sampleEmbeddings);

  // Body type to style recommendations mapping
  const styleMap: Record<string, string[]> = {
    slim: ["fitted", "structured", "layered"],
    athletic: ["tailored", "monochrome", "sporty"],
    average: ["balanced", "versatile", "mixed"],
    curvy: ["wrap", "cinched", "dark"],
    plus: ["structured", "vertical", "statement"],
  };

  // Height to fit recommendations
  const fitMap: Record<string, string[]> = {
    "Short (< 160cm)": ["petite", "cropped", "short"],
    "Medium (160-175cm)": ["standard", "regular", "mid"],
    "Tall (> 175cm)": ["long", "tall", "maxi"],
  };

  // Skin tone to color recommendations
  const colorMap: Record<string, string[]> = {
    Fair: ["bright", "cool", "jewel"],
    Medium: ["warm", "earth", "rich"],
    Olive: ["warm", "muted", "earthy"],
    Deep: ["bright", "bold", "vibrant"],
    Dark: ["bold", "jewel", "rich"],
  };

  // Score products based on metadata alignment
  const scored = allProducts.map((productId) => {
    let score = 0.5; // Base score

    // Get product from data if available
    try {
      const { getProductById } = require("@/lib/product-data");
      const product = getProductById(productId);

      if (product) {
        const name = (product.name || "").toLowerCase();
        const tags = (product.tags || []).map((t: string) => t.toLowerCase());
        const desc = (product.description || "").toLowerCase();

        // Match body type recommendations
        if (bodyMetrics.bodyType && styleMap[bodyMetrics.bodyType]) {
          styleMap[bodyMetrics.bodyType].forEach((style) => {
            if (
              name.includes(style) ||
              tags.some((t: string) => t.includes(style)) ||
              desc.includes(style)
            ) {
              score += 0.15;
            }
          });
        }

        // Match height recommendations
        if (bodyMetrics.height && fitMap[bodyMetrics.height]) {
          fitMap[bodyMetrics.height].forEach((fit) => {
            if (
              name.includes(fit) ||
              tags.some((t: string) => t.includes(fit)) ||
              desc.includes(fit)
            ) {
              score += 0.15;
            }
          });
        }

        // Match skin tone color recommendations
        if (bodyMetrics.skinTone && colorMap[bodyMetrics.skinTone]) {
          colorMap[bodyMetrics.skinTone].forEach((color) => {
            if (
              name.includes(color) ||
              tags.some((t: string) => t.includes(color)) ||
              desc.includes(color)
            ) {
              score += 0.1;
            }
          });
        }

        // Bonus for pose detection - show items that work with detected pose
        if (bodyMetrics.poseDetected) {
          if (
            tags.some(
              (t: string) => t.includes("flexible") || t.includes("movement"),
            )
          ) {
            score += 0.1;
          }
        }
      }
    } catch (e) {
      // If product lookup fails, use base score
    }

    return { id: productId, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.id);
}
