/**
 * StyleSense AI: Adaptive Deep Learning Model for Realistic Try-On Simulation
 * and Sustainable Fashion Recommendations
 */

import { Product } from "./product-data";

interface SustainabilityScore {
  score: number; // 0-100
  materials: string[];
  certifications: string[];
  isEcoFriendly: boolean;
}

interface StyleProfile {
  categories: Map<string, number>;
  colors: Map<string, number>;
  priceRange: { min: number; max: number };
  genders: string[];
  ratings: number[];
}

interface Recommendation {
  product: Product;
  styleScore: number; // 0-100: How well it matches user style
  sustainabilityScore: number; // 0-100: Environmental impact
  complementaryScore: number; // 0-100: How well it complements tried products
  overallScore: number; // 0-100: Combined score
  reason: string;
}

// Sustainable materials database
const SUSTAINABLE_MATERIALS = {
  organic: ["organic cotton", "organic", "organic linen"],
  recycled: ["recycled", "recycled polyester", "recycled nylon"],
  natural: ["cotton", "linen", "wool", "silk", "hemp", "bamboo"],
  vegan: ["vegan", "faux leather", "plant-based"],
};

const SUSTAINABLE_CERTIFICATIONS = [
  "Fair Trade",
  "GOTS", // Global Organic Textile Standard
  "OEKO-TEX",
  "Bluesign",
  "Carbon Neutral",
];

/**
 * Calculate sustainability score for a product
 */
export function calculateSustainabilityScore(
  product: Product,
): SustainabilityScore {
  let score = 0;
  const materials: string[] = [];
  const certifications: string[] = [];

  // Check materials
  const productMaterial = (product.material || "").toLowerCase();

  if (SUSTAINABLE_MATERIALS.organic.some((m) => productMaterial.includes(m))) {
    score += 30;
    materials.push("Organic");
  }
  if (SUSTAINABLE_MATERIALS.recycled.some((m) => productMaterial.includes(m))) {
    score += 25;
    materials.push("Recycled");
  }
  if (SUSTAINABLE_MATERIALS.natural.some((m) => productMaterial.includes(m))) {
    score += 20;
    materials.push("Natural");
  }
  if (SUSTAINABLE_MATERIALS.vegan.some((m) => productMaterial.includes(m))) {
    score += 15;
    materials.push("Vegan");
  }

  // Check certifications
  const productTags = (product.tags || []).join(" ").toLowerCase();
  SUSTAINABLE_CERTIFICATIONS.forEach((cert) => {
    if (productTags.includes(cert.toLowerCase())) {
      score += 10;
      certifications.push(cert);
    }
  });

  // Check if price is reasonable (budget-friendly sustainable options)
  if (product.price < 2000) {
    score += 5;
  }

  // Check description for sustainability keywords
  const description = (product.description || "").toLowerCase();
  if (description.includes("sustainable") || description.includes("eco")) {
    score += 5;
  }

  return {
    score: Math.min(score, 100),
    materials: [...new Set(materials)],
    certifications: [...new Set(certifications)],
    isEcoFriendly: score >= 40,
  };
}

/**
 * Build user style profile from try-on history
 */
export function buildStyleProfile(
  tryOns: Array<{ productId: string; productName: string }>,
  allProducts: Product[],
): StyleProfile {
  const categories = new Map<string, number>();
  const colors = new Map<string, number>();
  const prices: number[] = [];
  const genders = new Set<string>();
  const ratings: number[] = [];

  tryOns.forEach((tryOn) => {
    const product = allProducts.find((p) => p.id === tryOn.productId);
    if (!product) return;

    // Track categories
    const cat = product.category || "general";
    categories.set(cat, (categories.get(cat) || 0) + 1);

    // Track prices
    prices.push(product.price);

    // Track genders
    if (product.gender) genders.add(product.gender);

    // Track ratings
    ratings.push(product.rating);

    // Track colors from tags
    const colorTags = (product.tags || []).filter((t) =>
      /color|blue|red|black|white|green|pink|purple|yellow|orange|gray|brown|beige/i.test(
        t,
      ),
    );
    colorTags.forEach((color) => {
      colors.set(
        color.toLowerCase(),
        (colors.get(color.toLowerCase()) || 0) + 1,
      );
    });
  });

  return {
    categories,
    colors,
    priceRange: {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 5000),
    },
    genders: Array.from(genders),
    ratings,
  };
}

/**
 * Calculate style compatibility score
 */
function calculateStyleScore(product: Product, profile: StyleProfile): number {
  let score = 50; // Base score

  // Category matching
  if (profile.categories.has(product.category || "")) {
    score += 20;
  }

  // Price range matching
  if (
    product.price >= profile.priceRange.min &&
    product.price <= profile.priceRange.max
  ) {
    score += 15;
  }

  // Gender matching
  if (product.gender && profile.genders.includes(product.gender)) {
    score += 10;
  }

  // Rating bonus
  if (product.rating >= 4.5) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Calculate how well products complement each other
 */
function calculateComplementaryScore(
  product: Product,
  triedProducts: Product[],
): number {
  let score = 50; // Base score
  if (triedProducts.length === 0) return score;

  // Check if different category (complements not duplicates)
  const differentCategories =
    triedProducts.filter((p) => p.category !== product.category).length > 0;
  if (differentCategories) {
    score += 25;
  }

  // Check if similar style but different item
  const similarRating =
    triedProducts.filter((p) => Math.abs(p.rating - product.rating) < 0.5)
      .length > 0;
  if (similarRating) {
    score += 15;
  }

  // Price variety bonus
  const priceVariety = triedProducts.some(
    (p) => Math.abs(p.price - product.price) > 500,
  );
  if (priceVariety) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Generate AI recommendations
 */
export function generateRecommendations(
  allProducts: Product[],
  tryOns: Array<{ productId: string; productName: string }>,
  excludeIds: string[] = [],
  limit: number = 5,
): Recommendation[] {
  // Build style profile from try-on history
  const profile = buildStyleProfile(tryOns, allProducts);

  // Get tried products
  const triedProducts = tryOns
    .map((t) => allProducts.find((p) => p.id === t.productId))
    .filter((p): p is Product => p !== undefined);

  // Score all products
  const recommendations: Recommendation[] = allProducts
    .filter(
      (p) =>
        !excludeIds.includes(p.id) && !tryOns.some((t) => t.productId === p.id),
    )
    .map((product) => {
      const styleScore = calculateStyleScore(product, profile);
      const sustainabilityData = calculateSustainabilityScore(product);
      const complementaryScore = calculateComplementaryScore(
        product,
        triedProducts,
      );

      // Weighted overall score
      const overallScore =
        styleScore * 0.4 +
        sustainabilityData.score * 0.35 +
        complementaryScore * 0.25;

      // Generate recommendation reason
      let reason = "";
      if (sustainabilityData.isEcoFriendly) {
        reason += "Sustainable choice. ";
      }
      if (styleScore > 70) {
        reason += "Matches your style. ";
      }
      if (complementaryScore > 70) {
        reason += "Complements your taste. ";
      }
      if (!reason) {
        reason = "Highly rated by users.";
      }

      return {
        product,
        styleScore: Math.round(styleScore),
        sustainabilityScore: sustainabilityData.score,
        complementaryScore: Math.round(complementaryScore),
        overallScore: Math.round(overallScore),
        reason: reason.trim(),
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);

  return recommendations;
}

/**
 * Get similar products for outfit building
 */
export function getSimilarProducts(
  product: Product,
  allProducts: Product[],
  limit: number = 4,
): Product[] {
  return allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category &&
        p.gender === product.gender,
    )
    .sort((a, b) => {
      // Score similarity
      const aScore =
        Math.abs(a.price - product.price) < 500
          ? 10
          : 0 + (Math.abs(a.rating - product.rating) < 0.5 ? 10 : 0);
      const bScore =
        Math.abs(b.price - product.price) < 500
          ? 10
          : 0 + (Math.abs(b.rating - product.rating) < 0.5 ? 10 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

/**
 * Get sustainable alternatives to a product
 */
export function getSustainableAlternatives(
  product: Product,
  allProducts: Product[],
  limit: number = 3,
): Product[] {
  return allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category &&
        calculateSustainabilityScore(p).score >
          calculateSustainabilityScore(product).score,
    )
    .sort(
      (a, b) =>
        calculateSustainabilityScore(b).score -
        calculateSustainabilityScore(a).score,
    )
    .slice(0, limit);
}
