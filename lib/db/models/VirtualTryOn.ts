import mongoose, { Document, Schema } from "mongoose";

interface IVirtualTryOn extends Document {
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  photoProfileId: string; // Reference to PhotoProfile
  personName: string; // Name of person in photo
  uploadedImageUrl: string;
  tryOnImageUrl: string;
  matchScore: number; // 0-100 percentage match
  feedback: string;
  createdAt: Date;
  updatedAt: Date;
}

const VirtualTryOnSchema = new Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  photoProfileId: { type: String, required: true }, // Reference to PhotoProfile
  personName: { type: String, required: true }, // Name of person in photo
  uploadedImageUrl: { type: String, required: true },
  tryOnImageUrl: { type: String },
  matchScore: { type: Number, min: 0, max: 100 },
  feedback: { type: String }, // User feedback on the try-on
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

VirtualTryOnSchema.index({ userId: 1, createdAt: -1 });

const VirtualTryOn =
  mongoose.models.VirtualTryOn ||
  mongoose.model<IVirtualTryOn>("VirtualTryOn", VirtualTryOnSchema);

export default VirtualTryOn;
