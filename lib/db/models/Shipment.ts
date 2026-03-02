import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Shipment Document Interface
export interface IShipment extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  trackingNumber: string;
  deliveryPartnerId?: Types.ObjectId; // Delivery partner assigned
  carrier: "fedex" | "ups" | "dhl" | "aramex" | "local";
  status:
    | "pending"
    | "picked"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed";
  estimatedDelivery: Date;
  actualDelivery?: Date;
  pickupDate?: Date;
  shippedDate: Date;
  currentLocation?: string;
  events: {
    status: string;
    timestamp: Date;
    location?: string;
    description: string;
  }[];
  weight?: number;
  cost: number;
  insured: boolean;
  insuranceAmount?: number;
  signatureRequired: boolean;
  deliveryProof?: {
    imageUrl?: string;
    signature?: string;
    recipientName?: string;
    timestamp: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Shipment Schema
const ShipmentSchema = new Schema<IShipment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    carrier: {
      type: String,
      enum: ["fedex", "ups", "dhl", "aramex", "local"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "picked",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
      ],
      default: "pending",
      index: true,
    },
    estimatedDelivery: { type: Date, required: true },
    actualDelivery: { type: Date },
    pickupDate: { type: Date },
    shippedDate: { type: Date, required: true, index: true },
    currentLocation: { type: String },
    events: [
      {
        status: String,
        timestamp: Date,
        location: String,
        description: String,
        _id: false,
      },
    ],
    weight: { type: Number }, // in kg
    cost: { type: Number, required: true },
    insured: { type: Boolean, default: false },
    insuranceAmount: { type: Number },
    signatureRequired: { type: Boolean, default: false },
    deliveryProof: {
      imageUrl: String,
      signature: String,
      recipientName: String,
      timestamp: Date,
      _id: false,
    },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Create indexes for faster queries
ShipmentSchema.index({ status: 1, estimatedDelivery: 1 });
ShipmentSchema.index({ orderId: 1, shippedDate: -1 });

// Create or retrieve model
export const Shipment: Model<IShipment> =
  mongoose.models.Shipment ||
  mongoose.model<IShipment>("Shipment", ShipmentSchema);

export default Shipment;
