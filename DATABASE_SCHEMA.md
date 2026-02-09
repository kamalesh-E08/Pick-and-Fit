# MongoDB Database Schema Documentation

## Overview

This document describes the MongoDB database schema for the Pick&Fit e-commerce platform. The schema is built using Mongoose ODM for type safety and data validation.

## Database Connection

### Setup

1. **Install dependencies**:

```bash
npm install mongoose --legacy-peer-deps
```

2. **Configure environment variables** in `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=pickfit
```

3. **Import and use**:

```typescript
import { connectDB } from "@/lib/db/connection";
import { User, Product, Order } from "@/lib/db/models";

// Connect to database
await connectDB();

// Use models
const user = await User.findOne({ email: "user@example.com" });
```

## Collections & Schemas

### 1. Users Collection

Stores user account information, body metrics, and preferences.

**Schema**: [lib/db/models/User.ts](lib/db/models/User.ts)

**Fields**:

- `name`: String (required)
- `email`: String (required, unique, indexed)
- `password`: String (required) - hashed
- `photoId`: String - reference to stored photo
- `bodyMetrics`: Object
  - `detectedFace`: Boolean
  - `detectedBody`: Boolean
  - `estimatedHeight`: String
  - `estimatedBodyType`: Enum (slim, athletic, average, curvy, plus)
  - `skinTone`: String
  - `poseDetected`: Boolean
  - `estimatedWaistSize`: String
  - `estimatedBustSize`: String
  - `confidence`: Number (0-1)
  - `recommendations`: Array of Strings
  - `analyzedAt`: Date
- `addresses`: Array of Address objects
- `phone`: String
- `preferences`: Object
  - `favoriteCategories`: Array of Strings
  - `favoriteColors`: Array of Strings
  - `favoriteBrands`: Array of Strings
  - `sizePreferences`: Object
- `loyaltyPoints`: Number
- `isVerified`: Boolean
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes**:

- `email` (unique)
- `createdAt`

**Example**:

```typescript
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  password: hashedPassword,
  bodyMetrics: {
    estimatedBodyType: "athletic",
    estimatedHeight: "Medium (160-175cm)",
    skinTone: "Medium",
    confidence: 0.85,
  },
});
```

---

### 2. Products Collection

Stores product catalog with details, pricing, and AI embeddings.

**Schema**: [lib/db/models/Product.ts](lib/db/models/Product.ts)

**Fields**:

- `productId`: String (required, unique) - external ID
- `name`: String (required, indexed)
- `description`: String (required)
- `shortDescription`: String
- `price`: Number (required, indexed)
- `originalPrice`: Number (required)
- `category`: String (required, indexed)
- `subcategory`: String (indexed)
- `gender`: Enum (men, women, kids, unisex, beauty) (indexed)
- `brand`: String (indexed)
- `images`: Array of Strings
- `mainImage`: String (required)
- `rating`: Number (0-5, default: 4.0)
- `reviewCount`: Number
- `sizes`: Array of Strings
- `colors`: Array of Strings
- `tags`: Array of Strings
- `material`: String
- `careInstructions`: Array of Strings
- `features`: Array of Strings
- `stock`: Number
- `isAvailable`: Boolean
- `sustainabilityScore`: Number (0-100)
- `certifications`: Array of Strings
- `slug`: String (required, unique)
- `metaTitle`: String
- `metaDescription`: String
- `embedding`: Array of Numbers - for AI recommendations
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes**:

- `productId` (unique)
- `slug` (unique)
- `category`, `gender` (compound)
- `price`
- `rating`
- Full-text search on `name`, `description`, `tags`

**Example**:

```typescript
const product = await Product.create({
  productId: "prod-001",
  name: "Classic Cotton T-Shirt",
  description: "Comfortable everyday wear",
  price: 599,
  originalPrice: 999,
  category: "clothing",
  subcategory: "t-shirts",
  gender: "men",
  mainImage: "/products/tshirt-1.jpg",
  sizes: ["S", "M", "L", "XL"],
  colors: ["White", "Black", "Navy"],
  slug: "classic-cotton-tshirt",
  stock: 100,
});
```

---

### 3. Orders Collection

Stores customer orders with items, shipping, and payment details.

**Schema**: [lib/db/models/Order.ts](lib/db/models/Order.ts)

**Fields**:

- `userId`: ObjectId (ref: User, required, indexed)
- `orderNumber`: String (required, unique)
- `items`: Array of OrderItem objects
  - `productId`: ObjectId (ref: Product)
  - `productName`: String
  - `productImage`: String
  - `quantity`: Number
  - `size`: String
  - `color`: String
  - `price`: Number
  - `originalPrice`: Number
- `subtotal`: Number (required)
- `discount`: Number
- `shippingCost`: Number
- `tax`: Number
- `total`: Number (required)
- `paymentMethod`: Enum (card, upi, netbanking, cod, wallet)
- `paymentStatus`: Enum (pending, paid, failed, refunded) (indexed)
- `paymentId`: String
- `shippingAddress`: Object
- `trackingNumber`: String
- `orderStatus`: Enum (pending, confirmed, processing, shipped, delivered, cancelled, returned) (indexed)
- `isTryAtHome`: Boolean
- `tryPeriodEnd`: Date
- `customerNotes`: String
- `internalNotes`: String
- `orderDate`: Date
- `estimatedDelivery`: Date
- `deliveredAt`: Date
- `cancelledAt`: Date
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes**:

- `orderNumber` (unique)
- `userId`, `createdAt` (compound)
- `orderStatus`, `createdAt` (compound)

**Example**:

```typescript
const order = await Order.create({
  userId: user._id,
  orderNumber: "ORD-2026-0001",
  items: [
    {
      productId: product._id,
      productName: product.name,
      quantity: 2,
      size: "M",
      color: "Black",
      price: 599,
    },
  ],
  subtotal: 1198,
  total: 1198,
  paymentMethod: "upi",
  paymentStatus: "paid",
  shippingAddress: {
    /* ... */
  },
  orderStatus: "confirmed",
});
```

---

### 4. Reviews Collection

Stores product reviews with ratings and feedback.

**Schema**: [lib/db/models/Review.ts](lib/db/models/Review.ts)

**Fields**:

- `userId`: ObjectId (ref: User, required, indexed)
- `productId`: ObjectId (ref: Product, required, indexed)
- `orderId`: ObjectId (ref: Order)
- `rating`: Number (1-5, required)
- `title`: String (required, max 100)
- `comment`: String (required, max 1000)
- `sizeFeedback`: Enum (too_small, perfect, too_large)
- `fitFeedback`: Enum (tight, perfect, loose)
- `helpfulCount`: Number
- `notHelpfulCount`: Number
- `images`: Array of Strings
- `isVerifiedPurchase`: Boolean
- `isApproved`: Boolean
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Indexes**:

- `productId`, `createdAt` (compound)
- `userId`, `productId`, `orderId` (unique compound)
- `rating`

**Example**:

```typescript
const review = await Review.create({
  userId: user._id,
  productId: product._id,
  orderId: order._id,
  rating: 5,
  title: "Perfect fit!",
  comment: "Great quality and comfortable",
  sizeFeedback: "perfect",
  isVerifiedPurchase: true,
});
```

---

### 5. Cart Collection

Stores shopping cart items for users.

**Schema**: [lib/db/models/Cart.ts](lib/db/models/Cart.ts)

**Fields**:

- `userId`: ObjectId (ref: User, required, unique)
- `items`: Array of CartItem objects
  - `productId`: ObjectId (ref: Product)
  - `productName`: String
  - `productImage`: String
  - `quantity`: Number (min: 1)
  - `size`: String
  - `color`: String
  - `price`: Number
  - `originalPrice`: Number
  - `addedAt`: Date
- `itemCount`: Number (auto-calculated)
- `subtotal`: Number (auto-calculated)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Pre-save Hook**: Automatically calculates `itemCount` and `subtotal`

**Example**:

```typescript
const cart = await Cart.findOneAndUpdate(
  { userId: user._id },
  {
    $push: {
      items: {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        size: "M",
        color: "Black",
        price: product.price,
      },
    },
  },
  { upsert: true, new: true },
);
```

---

### 6. Wishlist Collection

Stores saved/wishlisted products for users.

**Schema**: [lib/db/models/Wishlist.ts](lib/db/models/Wishlist.ts)

**Fields**:

- `userId`: ObjectId (ref: User, required, unique)
- `items`: Array of WishlistItem objects
  - `productId`: ObjectId (ref: Product)
  - `productName`: String
  - `productImage`: String
  - `price`: Number
  - `originalPrice`: Number
  - `addedAt`: Date
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

**Example**:

```typescript
const wishlist = await Wishlist.findOneAndUpdate(
  { userId: user._id },
  {
    $addToSet: {
      items: {
        productId: product._id,
        productName: product.name,
        productImage: product.mainImage,
        price: product.price,
      },
    },
  },
  { upsert: true, new: true },
);
```

---

### 7. Events Collection

Stores user interaction events for analytics and recommendations.

**Schema**: [lib/db/models/Event.ts](lib/db/models/Event.ts)

**Fields**:

- `type`: Enum (view_product, add_to_cart, remove_from_cart, add_to_wishlist, remove_from_wishlist, purchase, search, filter, size_recommendation, virtual_tryon) (indexed)
- `payload`: Mixed object
  - `productId`: String
  - `userId`: String
  - `query`: String
  - `filters`: Any
  - Custom fields per event type
- `sessionId`: String (indexed)
- `userAgent`: String
- `ipAddress`: String
- `timestamp`: Date (indexed)
- `createdAt`: Date (auto)

**Indexes**:

- `type`, `timestamp` (compound)
- `payload.productId`, `timestamp` (compound)
- `payload.userId`, `timestamp` (compound)

**Example**:

```typescript
await Event.create({
  type: "view_product",
  payload: {
    productId: "prod-001",
    userId: "user@example.com",
  },
  sessionId: req.cookies.sessionId,
  timestamp: new Date(),
});
```

---

## API Integration Examples

### Example 1: User Signup with Photo Analysis

```typescript
// app/api/auth/signup/route.ts
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();

  const { name, email, password, bodyMetrics } = await req.json();

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    bodyMetrics,
  });

  return Response.json({ success: true, userId: user._id });
}
```

### Example 2: Get Personalized Product Recommendations

```typescript
// app/api/products/recommended/route.ts
import { connectDB } from "@/lib/db/connection";
import { User, Product, Event } from "@/lib/db/models";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Get user with body metrics
  const user = await User.findById(userId);

  // Get recently viewed products
  const recentEvents = await Event.find({
    "payload.userId": userId,
    type: "view_product",
  })
    .sort({ timestamp: -1 })
    .limit(10);

  // Find products matching body type
  const products = await Product.find({
    category: { $in: user.preferences.favoriteCategories },
    isAvailable: true,
  })
    .sort({ rating: -1 })
    .limit(20);

  return Response.json({ products });
}
```

### Example 3: Create Order with Try-at-Home

```typescript
// app/api/orders/create/route.ts
import { connectDB } from "@/lib/db/connection";
import { Order, Cart } from "@/lib/db/models";

export async function POST(req: Request) {
  await connectDB();

  const { userId, shippingAddress, isTryAtHome } = await req.json();

  // Get user's cart
  const cart = await Cart.findOne({ userId }).populate("items.productId");

  // Generate order number
  const orderNumber = `ORD-${Date.now()}`;

  // Calculate try period end date
  const tryPeriodEnd = isTryAtHome
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    : undefined;

  // Create order
  const order = await Order.create({
    userId,
    orderNumber,
    items: cart.items,
    subtotal: cart.subtotal,
    total: cart.subtotal,
    paymentMethod: "cod",
    paymentStatus: "pending",
    shippingAddress,
    orderStatus: "confirmed",
    isTryAtHome,
    tryPeriodEnd,
  });

  // Clear cart
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

  return Response.json({ success: true, order });
}
```

---

## Environment Variables

Create a `.env.local` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=pickfit

# Optional: MongoDB connection timeout
MONGODB_TIMEOUT=10000
```

---

## Database Utilities

### Check Connection Status

```typescript
import { isConnected } from "@/lib/db/connection";

if (isConnected()) {
  console.log("✅ Database connected");
}
```

### Disconnect (for cleanup)

```typescript
import { disconnectDB } from "@/lib/db/connection";

await disconnectDB();
```

---

## Best Practices

1. **Always connect before queries**:

   ```typescript
   await connectDB();
   const users = await User.find();
   ```

2. **Use lean() for read-only queries**:

   ```typescript
   const products = await Product.find().lean(); // Returns plain objects
   ```

3. **Index frequently queried fields**:
   - All schemas include indexes for common queries
   - Add custom indexes as needed

4. **Validate data before saving**:
   - Mongoose validators handle this automatically
   - Add custom validators in schema definitions

5. **Use transactions for critical operations**:
   ```typescript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     await Order.create([orderData], { session });
     await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
   } finally {
     session.endSession();
   }
   ```

---

## Next Steps

1. **Migrate existing data** to MongoDB
2. **Update API routes** to use MongoDB models
3. **Add authentication** middleware
4. **Implement caching** with Redis (optional)
5. **Set up backup strategy** for production

For questions or issues, refer to [Mongoose documentation](https://mongoosejs.com/docs/).
