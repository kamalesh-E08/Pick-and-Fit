import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";

// GET /api/track-order?orderId=xxx
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const trackingNumber = searchParams.get("trackingNumber");

    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { message: "Please provide orderId or trackingNumber" },
        { status: 400 },
      );
    }

    // Find order
    let order;
    if (orderId) {
      order = await Order.findById(orderId).lean();
    } else if (trackingNumber) {
      order = await Order.findOne({ trackingNumber }).lean();
    }

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Generate tracking data
    const trackingData = {
      orderNumber: order.orderNumber || order._id.toString(),
      trackingNumber: order.trackingNumber || "N/A",
      currentStatus: order.orderStatus || "pending",
      events: generateTrackingEvents(order),
      estimatedDelivery: order.estimatedDelivery,
      lastUpdate: order.updatedAt || new Date(),
      shippingAddress: order.shippingAddress,
      items: order.items?.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
      })),
    };

    return NextResponse.json({ tracking: trackingData }, { status: 200 });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { message: "Failed to fetch tracking information" },
      { status: 500 },
    );
  }
}

function generateTrackingEvents(order: any) {
  const events: any[] = [];
  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const currentStatusIndex = statuses.indexOf(order.orderStatus || "pending");

  // Generate events for completed statuses
  for (let i = 0; i <= currentStatusIndex; i++) {
    const status = statuses[i];
    const eventTime = new Date(order.createdAt);
    eventTime.setHours(eventTime.getHours() + i * 6); // Space events 6 hours apart

    events.push({
      status,
      timestamp: eventTime,
      location: getLocationForStatus(status),
      description: getDescriptionForStatus(status),
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
  };
  return descriptions[status] || "Order is being processed";
}
