import mongoose, { Document, Schema, Model, Types } from "mongoose";

// Cart Item Interface
export interface ICartItem {
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  originalPrice: number;
  addedAt: Date;
}

// Cart Document Interface
export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];

  // Summary
  itemCount: number;
  subtotal: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    itemCount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Update item count and subtotal before saving
CartSchema.pre("save", function (next) {
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  next();
});

// Indexes
CartSchema.index({ userId: 1 });

const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
