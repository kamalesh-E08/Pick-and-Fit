import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Wishlist Item Interface
export interface IWishlistItem {
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  price: number;
  originalPrice: number;
  addedAt: Date;
}

// Wishlist Document Interface
export interface IWishlist extends Document {
  userId: Types.ObjectId;
  items: IWishlistItem[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  },
);

// Indexes
WishlistSchema.index({ userId: 1 });

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
