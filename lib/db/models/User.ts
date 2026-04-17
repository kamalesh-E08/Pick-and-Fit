import mongoose, { Document, Schema, Model } from "mongoose";

// Body Metrics Interface
export interface IBodyMetrics {
  detectedFace: boolean;
  detectedBody: boolean;
  estimatedHeight: string;
  estimatedBodyType:
    | "slim"
    | "athletic"
    | "average"
    | "curvy"
    | "plus"
    | "unknown";
  skinTone: string;
  poseDetected: boolean;
  estimatedWaistSize: string;
  estimatedBustSize?: string;
  confidence: number;
  recommendations: string[];
  analyzedAt: Date;
}

// Address Interface
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// User Document Interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin" | "seller" | "delivery";
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  photoId?: string; // Reference to stored photo
  bodyMetrics?: IBodyMetrics;
  addresses: IAddress[];
  phone?: string;
  preferences: {
    favoriteCategories: string[];
    favoriteColors: string[];
    favoriteBrands: string[];
    sizePreferences: {
      tops?: string;
      bottoms?: string;
      shoes?: string;
    };
  };
  loyaltyPoints: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Body Metrics Schema
const BodyMetricsSchema = new Schema<IBodyMetrics>(
  {
    detectedFace: { type: Boolean, default: false },
    detectedBody: { type: Boolean, default: false },
    estimatedHeight: { type: String, default: "" },
    estimatedBodyType: {
      type: String,
      enum: ["slim", "athletic", "average", "curvy", "plus", "unknown"],
      default: "unknown",
    },
    skinTone: { type: String, default: "" },
    poseDetected: { type: Boolean, default: false },
    estimatedWaistSize: { type: String, default: "" },
    estimatedBustSize: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    recommendations: [{ type: String }],
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Address Schema
const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

// User Schema
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin", "seller", "delivery"],
      default: "customer",
      index: true,
    },
    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date },
    photoId: { type: String },
    bodyMetrics: { type: BodyMetricsSchema },
    addresses: [AddressSchema],
    phone: { type: String },
    preferences: {
      favoriteCategories: [{ type: String }],
      favoriteColors: [{ type: String }],
      favoriteBrands: [{ type: String }],
      sizePreferences: {
        tops: { type: String },
        bottoms: { type: String },
        shoes: { type: String },
      },
    },
    loyaltyPoints: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
UserSchema.index({ createdAt: -1 });

// Check if model exists to prevent recompilation in hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
