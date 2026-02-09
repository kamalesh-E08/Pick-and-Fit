import mongoose, { Document, Schema } from "mongoose";

interface IPaymentMethod extends Document {
  userId: string;
  userEmail: string;
  type: "credit_card" | "debit_card" | "paypal" | "apple_pay" | "google_pay";
  cardDetails?: {
    lastFour: string; // Last 4 digits of card
    brand: string; // Visa, Mastercard, Amex, etc.
    expiryMonth: number;
    expiryYear: number;
    holderName: string;
  };
  paypalDetails?: {
    email: string;
  };
  isDefault: boolean;
  isVerified: boolean;
  stripePaymentMethodId?: string; // Stripe payment method ID
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  type: {
    type: String,
    enum: ["credit_card", "debit_card", "paypal", "apple_pay", "google_pay"],
    required: true,
  },
  cardDetails: {
    lastFour: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    holderName: String,
  },
  paypalDetails: {
    email: String,
  },
  isDefault: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  stripePaymentMethodId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PaymentMethodSchema.index({ userId: 1, isDefault: 1 });

const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
