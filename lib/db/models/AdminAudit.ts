import mongoose, { Document, Schema, Model } from "mongoose";

// Admin Audit Log Interface
export interface IAdminAudit extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  entityType: "order" | "product" | "user" | "refund" | "shipment";
  entityId: string;
  changes: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: "success" | "failed";
  errorMessage?: string;
}

// Admin Audit Schema
const AdminAuditSchema = new Schema<IAdminAudit>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminEmail: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "view",
        "export",
        "approve",
        "reject",
        "refund",
        "update_status",
      ],
    },
    entityType: {
      type: String,
      enum: ["order", "product", "user", "refund", "shipment"],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    changes: { type: Schema.Types.Mixed },
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

// Create indexes for faster queries
AdminAuditSchema.index({ adminId: 1, timestamp: -1 });
AdminAuditSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AdminAuditSchema.index({ action: 1, timestamp: -1 });

// Create or retrieve model
export const AdminAudit: Model<IAdminAudit> =
  mongoose.models.AdminAudit ||
  mongoose.model<IAdminAudit>("AdminAudit", AdminAuditSchema);

export default AdminAudit;
