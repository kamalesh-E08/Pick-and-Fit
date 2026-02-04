import { Suspense } from "react";
import ProductDetailClient from "./product-detail-client";
import {
  getProductById,
  getRelatedProducts,
  beautyProducts,
} from "@/lib/product-data";
import { notFound } from "next/navigation";

function getProduct(id: string) {
  // First try to find the product in the main products array
  const product = getProductById(id);

  // If not found or it's the "not-found" product, check in beauty products
  if (!product || product.id === "not-found") {
    const beautyProduct = beautyProducts.find((p) => p.id === id);

    if (beautyProduct) {
      // Convert beauty product to match the Product interface
      return {
        id: beautyProduct.id,
        name: beautyProduct.name,
        price: beautyProduct.price,
        originalPrice: beautyProduct.originalPrice,
        image: beautyProduct.image,
        category: beautyProduct.category,
        subcategory: beautyProduct.subCategory,
        gender: "beauty",
        rating: beautyProduct.rating,
        reviewCount: 0,
        tags: beautyProduct.tags,
        shortDescription: beautyProduct.tags?.join(", "),
        description:
          "This premium beauty product is designed to enhance your skincare routine.",
        sizes: beautyProduct.sizes,
        colors: beautyProduct.colors,
      };
    }

    return { id: "not-found" };
  }

  return product;
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the product data
  const product = getProduct(params.id);

  // If product is not found, show 404 page
  if (product.id === "not-found") {
    notFound();
  }

  // Get related products
  const relatedProducts = getRelatedProducts(params.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense
        fallback={
          <div className="text-center py-20">Loading product details...</div>
        }
      >
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
        />
      </Suspense>
    </div>
  );
}
