import { Suspense } from "react";
import ProductDetailClient from "./product-detail-client";
import {
  getProductById,
  getRelatedProducts,
  beautyProducts,
} from "@/lib/product-data";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connection";
import Product from "@/lib/db/models/Product";
import mongoose from "mongoose";

async function getProduct(id: string) {
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

    try {
      await connectDB();

      const dbQuery: any[] = [{ productId: id }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        dbQuery.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const dbProduct: any = await Product.findOne({ $or: dbQuery }).lean();

      if (dbProduct) {
        return {
          id: String(dbProduct.productId || dbProduct._id),
          name: dbProduct.name,
          price: dbProduct.price,
          originalPrice: dbProduct.originalPrice || dbProduct.price,
          image: dbProduct.mainImage || dbProduct.images?.[0],
          category: dbProduct.category,
          subcategory: dbProduct.subcategory,
          gender: dbProduct.gender,
          rating: dbProduct.rating || 4,
          reviewCount: dbProduct.reviewCount || 0,
          tags: dbProduct.tags || [],
          shortDescription: dbProduct.shortDescription || dbProduct.description,
          description: dbProduct.description,
          sizes: dbProduct.sizes || [],
          colors: dbProduct.colors || [],
          material: dbProduct.material,
          brand: dbProduct.brand,
          features: dbProduct.features || [],
          careInstructions: dbProduct.careInstructions || [],
        };
      }
    } catch (error) {
      console.error("Error loading DB product detail:", error);
    }

    return { id: "not-found" };
  }

  return product;
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the product data
  const product = await getProduct(params.id);

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
