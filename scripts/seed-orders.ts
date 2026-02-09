/**
 * Seed Script for Orders with Payment and Tracking Data
 *
 * Usage: npx ts-node scripts/seed-orders.ts
 *
 * This script creates sample orders with payment data and tracking events
 * for testing the payment and tracking system.
 */

import mongoose from "mongoose";
import { connectDB } from "../lib/db/connection";
import Order from "../lib/db/models/Order";
import { generateOrderNumber } from "../lib/payment-utils";

const SAMPLE_ORDERS = [
  {
    userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
    paymentMethod: "card" as const,
    sampleData: {
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
    },
    status: "delivered" as const,
    daysOld: 3,
  },
  {
    userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
    paymentMethod: "upi" as const,
    sampleData: {
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
    },
    status: "shipped" as const,
    daysOld: 1,
  },
  {
    userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
    paymentMethod: "netbanking" as const,
    sampleData: {
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
    },
    status: "processing" as const,
    daysOld: 0,
  },
  {
    userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439014"),
    paymentMethod: "card" as const,
    sampleData: {
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
    },
    status: "confirmed" as const,
    daysOld: 0,
  },
];

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  originalPrice: number;
}

async function seedOrders() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Clear existing sample orders
    await Order.deleteMany({});
    console.log("🗑️  Cleared existing orders");

    const createdOrders = [];

    for (const orderData of SAMPLE_ORDERS) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - orderData.daysOld);

      const shippingFee = 99;
      const tax = Math.round(orderData.sampleData.subtotal * 0.18);
      const total = orderData.sampleData.subtotal + shippingFee + tax;

      // Create items array
      const items: OrderItem[] = orderData.sampleData.items.map(
        (item: any) => ({
          productId: new mongoose.Types.ObjectId(),
          productName: item.productName,
          productImage: "/default-product.jpg",
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          originalPrice: item.price,
        }),
      );

      // Generate tracking events based on status
      const trackingEvents = generateTrackingEvents(orderData.status, baseDate);

      // Create order
      const order = new Order({
        userId: orderData.userId,
        orderNumber: generateOrderNumber(),
        items,
        subtotal: orderData.sampleData.subtotal,
        discount: 0,
        shippingCost: shippingFee,
        tax,
        total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "paid",
        paymentId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        shippingAddress: {
          name: "Test Customer",
          street: "123 Main Street",
          city: "Bangalore",
          state: "Karnataka",
          zipCode: "560001",
          country: "India",
          phone: "9999999999",
        },
        trackingNumber: `TRACK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
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
    console.log(
      "\nYou can now track these orders at: http://localhost:3000/track-order",
    );
  } catch (error) {
    console.error("❌ Error seeding orders:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

function generateTrackingEvents(
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered",
  baseDate: Date,
) {
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

function getLocationForStatus(status: string): string {
  const locations: Record<string, string> = {
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

function getDescriptionForStatus(status: string): string {
  const descriptions: Record<string, string> = {
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

// Run the script
seedOrders();
