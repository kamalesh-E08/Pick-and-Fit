import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Order Item Interface
export interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  originalPrice: number;
}

// Shipping Address Interface
export interface IShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

// Tracking Event Interface
export interface ITrackingEvent {
  status: string;
  timestamp: Date;
  location?: string;
  description: string;
}

// Order Document Interface
export interface IOrder extends Document {
  userId: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];

  // Pricing
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;

  // Payment
  paymentMethod: "card" | "upi" | "netbanking" | "cod" | "wallet";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentId?: string;

  // Shipping
  shippingAddress: IShippingAddress;
  trackingNumber?: string;
  trackingEvents?: ITrackingEvent[];

  // Status
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

  // Try at home feature
  isTryAtHome: boolean;
  tryPeriodEnd?: Date;

  // Notes
  customerNotes?: string;
  internalNotes?: string;

  // Timestamps
  orderDate: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: "India" },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: { type: String },
    description: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, unique: true },
    items: [OrderItemSchema],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "cod", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentId: { type: String },

    shippingAddress: { type: ShippingAddressSchema, required: true },
    trackingNumber: { type: String },
    trackingEvents: [TrackingEventSchema],

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },

    isTryAtHome: { type: Boolean, default: false },
    tryPeriodEnd: { type: Date },

    customerNotes: { type: String },
    internalNotes: { type: String },

    orderDate: { type: Date, default: Date.now },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
