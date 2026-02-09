import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Review Document Interface
export interface IReview extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  orderId?: Types.ObjectId;

  rating: number; // 1-5
  title: string;
  comment: string;

  // Size & Fit Feedback
  sizeFeedback?: "too_small" | "perfect" | "too_large";
  fitFeedback?: "tight" | "perfect" | "loose";

  // Helpful votes
  helpfulCount: number;
  notHelpfulCount: number;

  // Images
  images?: string[];

  // Status
  isVerifiedPurchase: boolean;
  isApproved: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },

    sizeFeedback: {
      type: String,
      enum: ["too_small", "perfect", "too_large"],
    },
    fitFeedback: {
      type: String,
      enum: ["tight", "perfect", "loose"],
    },

    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },

    images: [{ type: String }],

    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Indexes
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ rating: -1 });

// Ensure user can only review a product once per order
ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
