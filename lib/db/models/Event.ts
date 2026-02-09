import mongoose, { Document, Schema, Model } from "mongoose";

// Event Document Interface
export interface IEvent extends Document {
  type:
    | "view_product"
    | "add_to_cart"
    | "remove_from_cart"
    | "add_to_wishlist"
    | "remove_from_wishlist"
    | "purchase"
    | "search"
    | "filter"
    | "size_recommendation"
    | "virtual_tryon";

  payload: {
    productId?: string;
    userId?: string;
    query?: string;
    filters?: any;
    category?: string;
    [key: string]: any;
  };

  // Session tracking
  sessionId?: string;

  // User agent & IP
  userAgent?: string;
  ipAddress?: string;

  // Timestamp
  timestamp: Date;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "view_product",
        "add_to_cart",
        "remove_from_cart",
        "add_to_wishlist",
        "remove_from_wishlist",
        "purchase",
        "search",
        "filter",
        "size_recommendation",
        "virtual_tryon",
      ],
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    sessionId: { type: String, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Indexes for analytics queries
EventSchema.index({ type: 1, timestamp: -1 });
EventSchema.index({ "payload.productId": 1, timestamp: -1 });
EventSchema.index({ "payload.userId": 1, timestamp: -1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
