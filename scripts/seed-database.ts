/**
 * Database Seeding Script
 *
 * This script seeds the MongoDB database with sample data:
 * - Products from existing product-data.ts
 * - Sample users with body metrics
 * - Sample orders and reviews
 *
 * Run with: npx tsx scripts/seed-database.ts
 */

import { connectDB, disconnectDB } from "../lib/db/connection";
import { User, Product, Order, Review, Event } from "../lib/db/models";
import { loadEnvConfig } from "@next/env";
import {
  getAllProducts,
  type Product as CatalogProduct,
} from "../lib/product-data";

// Ensure scripts can read values from .env.local/.env files.
loadEnvConfig(process.cwd());

async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n");

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing. Set it in your shell or .env.local before running the seed script.",
      );
    }

    // Connect to database
    const connection = await connectDB();
    if (!connection) {
      throw new Error(
        "MongoDB connection was not established. Check MONGODB_URI and database availability.",
      );
    }
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data (optional - comment out in production!)
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Event.deleteMany({}),
    ]);
    console.log("✅ Cleared existing data\n");

    // Seed Users
    console.log("👥 Seeding users...");
    const users = await User.insertMany([
      {
        name: "Seller Demo",
        email: "seller@pickfit.com",
        password: "$2a$10$rQZ5X.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X", // hashed "seller123"
        role: "seller",
        preferences: {
          favoriteCategories: ["casual-wear", "formal-wear"],
          favoriteColors: ["black", "white", "blue"],
          favoriteBrands: [],
          sizePreferences: {
            tops: "M",
            bottoms: "M",
            shoes: "8",
          },
        },
        loyaltyPoints: 0,
        isVerified: true,
      },
      {
        name: "John Doe",
        email: "john@example.com",
        password: "$2a$10$rQZ5X.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X", // hashed "password123"
        bodyMetrics: {
          detectedFace: true,
          detectedBody: true,
          estimatedHeight: "Medium (160-175cm)",
          estimatedBodyType: "athletic",
          skinTone: "Medium",
          poseDetected: true,
          estimatedWaistSize: "S-M",
          estimatedBustSize: "34-36",
          confidence: 0.85,
          recommendations: [
            "Emphasize your fit physique with tailored cuts",
            "Monochrome looks enhance your lines",
          ],
          analyzedAt: new Date(),
        },
        preferences: {
          favoriteCategories: ["tops", "activewear"],
          favoriteColors: ["black", "navy", "gray"],
          favoriteBrands: [],
          sizePreferences: {
            tops: "M",
            bottoms: "M",
            shoes: "9",
          },
        },
        loyaltyPoints: 100,
        isVerified: true,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "$2a$10$rQZ5X.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X",
        bodyMetrics: {
          detectedFace: true,
          detectedBody: true,
          estimatedHeight: "Medium (160-175cm)",
          estimatedBodyType: "curvy",
          skinTone: "Fair",
          poseDetected: true,
          estimatedWaistSize: "L-XL",
          estimatedBustSize: "38-40",
          confidence: 0.82,
          recommendations: [
            "Embrace wrap dresses and cinched waists",
            "Dark colors on lower body create balance",
          ],
          analyzedAt: new Date(),
        },
        preferences: {
          favoriteCategories: ["dresses", "tops"],
          favoriteColors: ["red", "black", "blue"],
          favoriteBrands: [],
          sizePreferences: {
            tops: "L",
            bottoms: "L",
            shoes: "7",
          },
        },
        loyaltyPoints: 250,
        isVerified: true,
      },
    ]);
    console.log(`✅ Seeded ${users.length} users\n`);

    const sellerUser = users.find((user) => user.role === "seller");
    if (!sellerUser) {
      throw new Error("Seller user was not created during seeding");
    }
    const primaryCustomer = users.find(
      (user) => user.email === "john@example.com",
    );
    const secondaryCustomer = users.find(
      (user) => user.email === "jane@example.com",
    );
    if (!primaryCustomer || !secondaryCustomer) {
      throw new Error("Customer users were not created during seeding");
    }

    // Seed Products
    console.log("📦 Seeding products...");
    const allProducts = getAllProducts();
    const productsToInsert = allProducts.map(
      (product: CatalogProduct, index: number) => ({
        productId: product.id,
        sellerId: sellerUser._id,
        name: product.name,
        description: product.description || `High-quality ${product.name}`,
        shortDescription: product.shortDescription,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        category: product.category || "clothing",
        subcategory: product.subcategory,
        gender: product.gender || "unisex",
        brand: product.brand,
        images: [product.image],
        mainImage: product.image,
        rating: product.rating || 4.0,
        reviewCount: product.reviewCount || 0,
        sizes: product.sizes || ["S", "M", "L", "XL"],
        colors: product.colors || ["Black", "White"],
        tags: product.tags || [],
        material: product.material,
        careInstructions: product.careInstructions,
        features: product.features,
        stock: 50,
        isAvailable: true,
        sustainabilityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        certifications: ["GOTS"],
        slug: `${product.name.toLowerCase().replace(/\s+/g, "-")}-${index}`,
        metaTitle: product.name,
        metaDescription: product.description,
      }),
    );

    const products = await Product.insertMany(productsToInsert);
    console.log(`✅ Seeded ${products.length} products\n`);

    // Seed Orders
    console.log("🛍️  Seeding orders...");
    const sampleOrders = [
      {
        userId: primaryCustomer._id,
        orderNumber: `ORD-${Date.now()}-001`,
        items: [
          {
            productId: products[0]._id,
            productName: products[0].name,
            productImage: products[0].mainImage,
            quantity: 2,
            size: "M",
            color: "Black",
            price: products[0].price,
            originalPrice: products[0].originalPrice,
          },
        ],
        subtotal: products[0].price * 2,
        total: products[0].price * 2,
        paymentMethod: "upi" as const,
        paymentStatus: "paid" as const,
        shippingAddress: {
          name: primaryCustomer.name,
          street: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          zipCode: "400001",
          country: "India",
          phone: "+91 9876543210",
        },
        orderStatus: "delivered" as const,
        deliveredAt: new Date(),
      },
    ];

    const orders = await Order.insertMany(sampleOrders);
    console.log(`✅ Seeded ${orders.length} orders\n`);

    // Seed Reviews
    console.log("⭐ Seeding reviews...");
    const sampleReviews = [
      {
        userId: primaryCustomer._id,
        productId: products[0]._id,
        orderId: orders[0]._id,
        rating: 5,
        title: "Excellent quality!",
        comment:
          "The fabric is soft and the fit is perfect. Highly recommended!",
        sizeFeedback: "perfect" as const,
        fitFeedback: "perfect" as const,
        helpfulCount: 12,
        isVerifiedPurchase: true,
        isApproved: true,
      },
      {
        userId: secondaryCustomer._id,
        productId: products[0]._id,
        rating: 4,
        title: "Good value for money",
        comment: "Nice product but could be better quality.",
        sizeFeedback: "perfect" as const,
        fitFeedback: "loose" as const,
        helpfulCount: 5,
        isVerifiedPurchase: false,
        isApproved: true,
      },
    ];

    const reviews = await Review.insertMany(sampleReviews);
    console.log(`✅ Seeded ${reviews.length} reviews\n`);

    // Seed Events
    console.log("📊 Seeding events...");
    const sampleEvents = [
      {
        type: "view_product" as const,
        payload: {
          productId: products[0].productId,
          userId: primaryCustomer.email,
        },
        timestamp: new Date(),
      },
      {
        type: "add_to_cart" as const,
        payload: {
          productId: products[0].productId,
          userId: primaryCustomer.email,
        },
        timestamp: new Date(),
      },
      {
        type: "purchase" as const,
        payload: {
          productId: products[0].productId,
          userId: primaryCustomer.email,
          orderId: orders[0].orderNumber,
        },
        timestamp: new Date(),
      },
    ];

    const events = await Event.insertMany(sampleEvents);
    console.log(`✅ Seeded ${events.length} events\n`);

    console.log("🎉 Database seeding completed successfully!\n");
    console.log("Summary:");
    console.log(`  - ${users.length} users`);
    console.log(`  - ${products.length} products`);
    console.log(`  - ${orders.length} orders`);
    console.log(`  - ${reviews.length} reviews`);
    console.log(`  - ${events.length} events`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run seeding
seedDatabase();
