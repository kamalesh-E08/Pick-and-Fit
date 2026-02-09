/**
 * Seed Script for Orders - JavaScript Version
 *
 * This is a pure Node.js script that doesn't require ts-node or TypeScript compilation
 * Usage: node scripts/seed-orders.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

// Order Schema (simplified for seeding)
const orderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  orderNumber: { type: String, required: true, unique: true },
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      productImage: String,
      quantity: Number,
      size: String,
      color: String,
      price: Number,
      originalPrice: Number,
    },
  ],
  subtotal: Number,
  discount: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  tax: Number,
  total: Number,
  paymentMethod: {
    type: String,
    enum: ["card", "upi", "netbanking", "cod", "wallet"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentId: String,
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: "India" },
    phone: String,
  },
  trackingNumber: String,
  trackingEvents: [
    {
      status: String,
      timestamp: Date,
      location: String,
      description: String,
    },
  ],
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
  },
  isTryAtHome: { type: Boolean, default: false },
  tryPeriodEnd: Date,
  customerNotes: String,
  internalNotes: String,
  orderDate: Date,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

const SAMPLE_ORDERS = [
  {
    paymentMethod: "card",
    email: "test@example.com",
    items: [
      {
        productName: "Premium Cotton T-Shirt",
        quantity: 1,
        price: 499,
        color: "Blue",
        size: "M",
      },
    ],
    subtotal: 499,
    status: "delivered",
    daysOld: 3,
  },
  {
    paymentMethod: "upi",
    email: "user@example.com",
    items: [
      {
        productName: "Designer Jeans",
        quantity: 1,
        price: 1599,
        color: "Black",
        size: "32",
      },
    ],
    subtotal: 1599,
    status: "shipped",
    daysOld: 1,
  },
  {
    paymentMethod: "netbanking",
    email: "customer@example.com",
    items: [
      {
        productName: "Sports Shoes",
        quantity: 1,
        price: 2999,
        color: "White",
        size: "10",
      },
    ],
    subtotal: 2999,
    status: "processing",
    daysOld: 0,
  },
  {
    paymentMethod: "card",
    email: "shopper@example.com",
    items: [
      {
        productName: "Casual Dress",
        quantity: 2,
        price: 899,
        color: "Red",
        size: "S",
      },
    ],
    subtotal: 1798,
    status: "confirmed",
    daysOld: 0,
  },
];

function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

function generateTrackingNumber() {
  return `TRACK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function getLocationForStatus(status) {
  const locations = {
    pending: "Order Center",
    confirmed: "Processing Center",
    processing: "Warehouse",
    shipped: "In Transit Hub",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Return Center",
  };
  return locations[status] || "Order Center";
}

function getDescriptionForStatus(status) {
  const descriptions = {
    pending: "Your order has been received and is being processed.",
    confirmed: "Order confirmed and payment verified.",
    processing: "Your items are being picked and prepared.",
    shipped: "Your order has been shipped and is on its way.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled.",
    returned: "Your order has been returned.",
  };
  return descriptions[status] || "Order is being processed";
}

function generateTrackingEvents(status, baseDate) {
  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const statusIndex = statuses.indexOf(status);
  const events = [];

  for (let i = 0; i <= statusIndex; i++) {
    const eventStatus = statuses[i];
    const eventTime = new Date(baseDate.getTime() + i * 6 * 60 * 60 * 1000);

    events.push({
      status: eventStatus,
      timestamp: eventTime,
      location: getLocationForStatus(eventStatus),
      description: getDescriptionForStatus(eventStatus),
    });
  }

  return events;
}

async function seedOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI not found in .env.local. Please set it up first.",
      );
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || "pickfit",
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing sample orders
    console.log("🗑️  Clearing existing orders...");
    await Order.deleteMany({});

    const createdOrders = [];

    // Create sample orders
    for (const orderData of SAMPLE_ORDERS) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - orderData.daysOld);

      const shippingFee = 99;
      const tax = Math.round(orderData.subtotal * 0.18);
      const total = orderData.subtotal + shippingFee + tax;

      const items = orderData.items.map((item) => ({
        productId: new mongoose.Types.ObjectId(),
        productName: item.productName,
        productImage: "/default-product.jpg",
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        originalPrice: item.price,
      }));

      const trackingEvents = generateTrackingEvents(orderData.status, baseDate);

      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        orderNumber: generateOrderNumber(),
        items,
        subtotal: orderData.subtotal,
        discount: 0,
        shippingCost: shippingFee,
        tax,
        total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "paid",
        paymentId: `TXN-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        shippingAddress: {
          name: "Test Customer",
          street: "123 Main Street",
          city: "Bangalore",
          state: "Karnataka",
          zipCode: "560001",
          country: "India",
          phone: "9999999999",
        },
        trackingNumber: generateTrackingNumber(),
        trackingEvents,
        orderStatus: orderData.status,
        isTryAtHome: Math.random() > 0.7,
        orderDate: baseDate,
        estimatedDelivery:
          orderData.status !== "delivered"
            ? new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            : undefined,
        deliveredAt:
          orderData.status === "delivered"
            ? new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000)
            : undefined,
        createdAt: baseDate,
        updatedAt: baseDate,
      });

      await order.save();
      createdOrders.push(order);
    }

    console.log(`\n✅ Created ${createdOrders.length} sample orders:\n`);

    for (const order of createdOrders) {
      console.log(`📦 Order: ${order.orderNumber}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Tracking: ${order.trackingNumber}`);
      console.log(`   Amount: ₹${order.total}`);
      console.log();
    }

    console.log("🎉 Order seeding completed successfully!");
    console.log("\nYou can now track these orders at:");
    console.log("http://localhost:3000/track-order");
  } catch (error) {
    console.error("❌ Error seeding orders:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

// Run the script
seedOrders();
