import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Product Document Interface
export interface IProduct extends Document {
  productId: string; // External ID (e.g., "1", "2", etc.)
  sellerId?: Types.ObjectId;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice: number;
  category: string;
  subcategory?: string;
  gender: "men" | "women" | "kids" | "unisex" | "beauty";
  brand?: string;
  images: string[];
  mainImage: string;
  rating: number;
  reviewCount: number;
  sizes: string[];
  colors: string[];
  tags: string[];
  material?: string;
  careInstructions?: string[];
  features?: string[];

  // Inventory
  stock: number;
  isAvailable: boolean;

  // Sustainability
  sustainabilityScore?: number;
  certifications?: string[];

  // SEO
  slug: string;
  metaTitle?: string;
  metaDescription?: string;

  // Embeddings for AI recommendations
  embedding?: number[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    gender: {
      type: String,
      enum: ["men", "women", "kids", "unisex", "beauty"],
      required: true,
      index: true,
    },
    brand: { type: String, index: true },
    images: [{ type: String }],
    mainImage: { type: String, required: true },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    tags: [{ type: String }],
    material: { type: String },
    careInstructions: [{ type: String }],
    features: [{ type: String }],

    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },

    sustainabilityScore: { type: Number, min: 0, max: 100 },
    certifications: [{ type: String }],

    slug: { type: String, required: true, unique: true },
    metaTitle: { type: String },
    metaDescription: { type: String },

    embedding: [{ type: Number }],
  },
  {
    timestamps: true,
  },
);

// Indexes for search and filtering
ProductSchema.index({ name: "text", description: "text", tags: "text" });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1, gender: 1 });
ProductSchema.index({ sellerId: 1, createdAt: -1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
