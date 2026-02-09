# MongoDB Integration - Complete Setup Guide

## ✅ What Was Added

### 1. **Mongoose ODM Integration**

- Installed `mongoose` for schema modeling and type safety
- Created connection management with caching for development

### 2. **7 Database Collections with Schemas**

#### **Users** - User accounts and body metrics

- Email/password authentication
- Body metrics from photo analysis
- Shipping addresses
- Preferences and favorites
- Loyalty points system

#### **Products** - Product catalog

- Full product details (name, description, price)
- Categories, tags, and filters
- AI embeddings for recommendations
- Sustainability scores
- Inventory management

#### **Orders** - Customer orders

- Order items with size/color
- Payment and shipping details
- Try-at-home feature support
- Order status tracking
- Delivery management

#### **Reviews** - Product reviews

- Star ratings (1-5)
- Size and fit feedback
- Verified purchase badges
- Helpful voting system
- Image attachments

#### **Cart** - Shopping carts

- Real-time item management
- Auto-calculated subtotals
- Size and color selection
- One cart per user

#### **Wishlist** - Saved items

- Quick add/remove
- Price tracking
- One wishlist per user

#### **Events** - Analytics tracking

- User interactions
- Product views
- Purchase events
- For AI recommendations

### 3. **Files Created**

```
lib/db/
├── connection.ts          # MongoDB connection with caching
└── models/
    ├── User.ts           # User schema with body metrics
    ├── Product.ts        # Product catalog schema
    ├── Order.ts          # Orders with try-at-home
    ├── Review.ts         # Product reviews
    ├── Cart.ts           # Shopping cart
    ├── Wishlist.ts       # Saved items
    ├── Event.ts          # Analytics events
    └── index.ts          # Central exports

scripts/
└── seed-database.ts       # Database seeding script

.env.example               # Environment variables template
DATABASE_SCHEMA.md         # Complete documentation
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies

Already done! Mongoose is installed.

### Step 2: Set Up MongoDB

1. **Create MongoDB Atlas account** (free tier available)
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create a cluster (free M0 tier)
   - Get your connection string

2. **Create `.env.local` file**:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB_NAME=pickfit
   ```

3. **Whitelist your IP** in MongoDB Atlas:
   - Go to Network Access
   - Add your IP or allow all (0.0.0.0/0 for development)

### Step 3: Seed Database (Optional)

```bash
npx tsx scripts/seed-database.ts
```

This will populate your database with:

- 2 sample users with body metrics
- All existing products from product-data.ts
- Sample orders and reviews
- Analytics events

### Step 4: Use in Your API Routes

```typescript
import { connectDB } from "@/lib/db/connection";
import { User, Product, Order } from "@/lib/db/models";

export async function GET() {
  await connectDB();

  const products = await Product.find({ isAvailable: true })
    .sort({ rating: -1 })
    .limit(10);

  return Response.json({ products });
}
```

---

## 📖 Schema Overview

### User Schema Highlights

```typescript
{
  email: "user@example.com",
  bodyMetrics: {
    estimatedBodyType: "athletic",
    estimatedHeight: "Medium (160-175cm)",
    skinTone: "Medium",
    poseDetected: true,
    recommendations: ["Tailored cuts work well", "..."]
  },
  preferences: {
    favoriteCategories: ["tops", "activewear"],
    sizePreferences: { tops: "M", bottoms: "M" }
  }
}
```

### Product Schema Highlights

```typescript
{
  productId: "prod-001",
  name: "Classic Cotton T-Shirt",
  price: 599,
  category: "clothing",
  gender: "men",
  sizes: ["S", "M", "L", "XL"],
  sustainabilityScore: 85,
  embedding: [0.1, 0.2, ...], // For AI recommendations
  stock: 100
}
```

### Order Schema Highlights

```typescript
{
  orderNumber: "ORD-2026-0001",
  items: [{
    productId: ObjectId,
    quantity: 2,
    size: "M",
    price: 599
  }],
  paymentStatus: "paid",
  orderStatus: "delivered",
  isTryAtHome: true,
  tryPeriodEnd: Date
}
```

---

## 🔧 Integration Examples

### Example 1: User Registration with Photo

```typescript
// app/api/auth/signup/route.ts
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();

  const { name, email, password, bodyMetrics } = await req.json();

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    bodyMetrics, // From photo analysis API
  });

  return Response.json({ success: true, userId: user._id });
}
```

### Example 2: Add to Cart

```typescript
// app/api/cart/add/route.ts
import { connectDB } from "@/lib/db/connection";
import { Cart } from "@/lib/db/models";

export async function POST(req: Request) {
  await connectDB();

  const { userId, productId, size, color, quantity } = await req.json();

  const cart = await Cart.findOneAndUpdate(
    { userId },
    {
      $push: {
        items: {
          productId,
          size,
          color,
          quantity,
          // ... other fields
        },
      },
    },
    { upsert: true, new: true },
  );

  return Response.json({ cart });
}
```

### Example 3: Body-Aware Recommendations

```typescript
// app/api/products/recommended/route.ts
import { connectDB } from "@/lib/db/connection";
import { User, Product } from "@/lib/db/models";

export async function GET(req: Request) {
  await connectDB();

  const userId = req.headers.get("user-id");
  const user = await User.findById(userId);

  // Find products matching body type
  const bodyType = user?.bodyMetrics?.estimatedBodyType;

  const products = await Product.find({
    $text: { $search: bodyType }, // Text search on tags
    isAvailable: true,
  })
    .sort({ rating: -1 })
    .limit(10);

  return Response.json({ products, bodyType });
}
```

---

## 📊 Database Indexes

All schemas include optimized indexes for common queries:

- **Users**: `email`, `createdAt`
- **Products**: `productId`, `category+gender`, `price`, `rating`, full-text search
- **Orders**: `orderNumber`, `userId+createdAt`, `orderStatus`
- **Reviews**: `productId+createdAt`, `userId+productId+orderId` (unique)
- **Cart**: `userId` (unique)
- **Wishlist**: `userId` (unique)
- **Events**: `type+timestamp`, `productId+timestamp`, `userId+timestamp`

---

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - Use `.env.example` as template
2. **Hash passwords** - Use bcrypt or similar
3. **Validate input** - Mongoose schemas include validation
4. **Use transactions** - For critical operations (orders, payments)
5. **Rate limiting** - Implement on API routes
6. **Sanitize queries** - Mongoose protects against injection by default

---

## 🧪 Testing

### Test Connection

```typescript
import { connectDB, isConnected } from "@/lib/db/connection";

await connectDB();
console.log("Connected:", isConnected()); // true
```

### Query Data

```bash
# Connect to MongoDB
mongosh "mongodb+srv://cluster.mongodb.net/pickfit"

# Count documents
db.users.countDocuments()
db.products.countDocuments()

# Find all users
db.users.find().pretty()
```

---

## 🎯 Next Steps

### Phase 1: Authentication

- [ ] Implement NextAuth.js with MongoDB adapter
- [ ] Add JWT token generation
- [ ] Create protected API routes

### Phase 2: Migrate APIs

- [ ] Update `/api/cart` to use MongoDB
- [ ] Update `/api/wishlist` to use MongoDB
- [ ] Update `/api/orders` to use MongoDB
- [ ] Update `/api/reviews` to use MongoDB

### Phase 3: Advanced Features

- [ ] Implement search with MongoDB text search
- [ ] Add product filtering with aggregations
- [ ] Set up change streams for real-time updates
- [ ] Add Redis caching layer

### Phase 4: Production Ready

- [ ] Set up MongoDB Atlas backups
- [ ] Configure connection pooling
- [ ] Add monitoring and alerts
- [ ] Implement data retention policies

---

## 📚 Resources

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Mongoose Docs**: https://mongoosejs.com/docs/
- **Schema Design**: https://www.mongodb.com/docs/manual/core/data-modeling-introduction/
- **Indexing**: https://www.mongodb.com/docs/manual/indexes/

---

## 🆘 Troubleshooting

### Issue: "MONGODB_URI is not defined"

**Solution**: Create `.env.local` with your connection string

### Issue: "Cannot connect to MongoDB"

**Solution**:

1. Check IP whitelist in MongoDB Atlas
2. Verify connection string format
3. Check network connectivity

### Issue: "Model already defined"

**Solution**: This is expected in development with hot reload. The code handles it.

### Issue: "Validation error"

**Solution**: Check required fields match the schema definition

---

## ✨ Summary

You now have a complete MongoDB setup with:

- ✅ 7 fully-typed Mongoose schemas
- ✅ Connection management with caching
- ✅ Database seeding script
- ✅ Comprehensive documentation
- ✅ Ready-to-use API examples
- ✅ Production-ready architecture

**All files compile successfully with no errors!** 🎉

Start by setting up your `.env.local` and running the seed script to populate your database with sample data.
