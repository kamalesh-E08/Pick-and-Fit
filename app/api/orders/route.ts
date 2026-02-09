import mongoose from "mongoose";
import { connect } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import { NextRequest, NextResponse } from "next/server";
import { generateOrderNumber } from "@/lib/payment-utils";

// GET /api/orders - List user's orders
export async function GET(req: NextRequest) {
  try {
    await connect();

    const userId = req.nextUrl.searchParams.get("userId");
    const email = req.nextUrl.searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "userId or email parameter required" },
        { status: 400 },
      );
    }

    const query: any = {};
    if (userId) query.userId = userId;
    if (email) query.userEmail = email;

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(req: NextRequest) {
  try {
    await connect();

    const {
      userId,
      userEmail,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingCost,
      total,
    } = await req.json();

    // Validation
    if (!userId || !userEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.phone
    ) {
      return NextResponse.json(
        { error: "Incomplete shipping address" },
        { status: 400 },
      );
    }

    // Get user data for order
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create order
    const mappedItems = items.map((item: any) => {
      const productId = item.productId || item.id;
      const resolvedProductId = mongoose.Types.ObjectId.isValid(productId)
        ? new mongoose.Types.ObjectId(productId)
        : new mongoose.Types.ObjectId();

      return {
        productId: resolvedProductId,
        productName: item.productName || item.name || "Item",
        productImage: item.productImage || item.image || "",
        quantity: item.quantity || 1,
        size: item.size || item.selectedSize || "One Size",
        color: item.color || item.selectedColor || "Default",
        price: item.price || 0,
        originalPrice: item.originalPrice || item.price || 0,
      };
    });

    const resolvedPaymentMethod = [
      "card",
      "upi",
      "netbanking",
      "cod",
      "wallet",
    ].includes(paymentMethod)
      ? paymentMethod
      : "card";

    const order = new Order({
      userId,
      userEmail,
      userName: user.name,
      orderNumber: generateOrderNumber(),
      items: mappedItems,
      shippingAddress: {
        name: shippingAddress.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone,
      },
      paymentMethod: resolvedPaymentMethod,
      paymentStatus: "pending",
      subtotal: subtotal || 0,
      tax: tax || 0,
      shippingCost: shippingCost || 0,
      total: total || subtotal || 0,
      orderStatus: "pending",
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await order.save();

    return NextResponse.json(
      {
        message: "Order created successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          total: order.total,
          createdAt: order.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/orders/[id] - Update order status
export async function PUT(req: NextRequest) {
  try {
    await connect();

    const { orderId, status, orderStatus } = await req.json();

    const nextStatus = orderStatus || status;

    if (!orderId || !nextStatus) {
      return NextResponse.json(
        { error: "orderId and status required" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!validStatuses.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Valid options: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: nextStatus, updatedAt: new Date() },
      { new: true },
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Order status updated", order },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
