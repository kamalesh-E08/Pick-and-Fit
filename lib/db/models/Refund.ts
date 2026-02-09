import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Refund Document Interface
export interface IRefund extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  reason: string;
  amount: number;
  status: "pending" | "approved" | "processing" | "completed" | "rejected";
  refundMethod: "original_payment" | "wallet" | "bank_transfer";
  refundTransactionId?: string;
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  rejectionReason?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  attachments?: string[]; // URLs to proof images
  notes?: string;
  internalNotes?: string;
  processedBy?: Types.ObjectId; // Admin who processed it
}

// Refund Schema
const RefundSchema = new Schema<IRefund>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "defective_product",
        "wrong_item",
        "size_mismatch",
        "not_as_described",
        "late_delivery",
        "changed_mind",
        "damaged_in_transit",
        "other",
      ],
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },
    refundMethod: {
      type: String,
      enum: ["original_payment", "wallet", "bank_transfer"],
      default: "original_payment",
    },
    refundTransactionId: { type: String },
    requestDate: { type: Date, default: Date.now, index: true },
    approvedDate: { type: Date },
    completedDate: { type: Date },
    rejectionReason: { type: String },
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        _id: false,
      },
    ],
    attachments: [{ type: String }],
    notes: { type: String },
    internalNotes: { type: String },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Create indexes
RefundSchema.index({ status: 1, requestDate: -1 });
RefundSchema.index({ userId: 1, requestDate: -1 });

// Create or retrieve model
export const Refund: Model<IRefund> =
  mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);

export default Refund;
