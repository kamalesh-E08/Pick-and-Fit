import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";

export async function GET(req: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error("Delivery stats error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    // TODO: Get delivery partner ID from JWT token
    // For now, we'll use a placeholder
    const deliveryPartnerId = req.headers.get("x-user-id"); // Should come from JWT

    if (!deliveryPartnerId) {
      return NextResponse.json(
        { error: "Unauthorized - Delivery partner ID required" },
        { status: 401 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's deliveries
    const todayDeliveries = await Shipment.countDocuments({
      deliveryPartnerId,
      shippedDate: { $gte: today, $lt: tomorrow },
    });

    // Get pending pickups
    const pendingPickups = await Shipment.countDocuments({
      deliveryPartnerId,
      status: "pending",
    });

    // Get in-transit shipments
    const inTransit = await Shipment.countDocuments({
      deliveryPartnerId,
      status: { $in: ["in_transit", "out_for_delivery"] },
    });

    // Get completed today
    const completedToday = await Shipment.countDocuments({
      deliveryPartnerId,
      status: "delivered",
      actualDelivery: { $gte: today, $lt: tomorrow },
    });

    // Calculate earnings (assuming ₹50 per delivery)
    const deliveryRate = 50;
    const totalEarnings = completedToday * deliveryRate;

    // Mock rating (in production, calculate from feedback)
    const rating = 4.5;

    return NextResponse.json({
      stats: {
        todayDeliveries,
        pendingPickups,
        inTransit,
        completedToday,
        totalEarnings,
        rating,
      },
    });
  } catch (error) {
    console.error("Delivery stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery stats" },
      { status: 500 },
    );
  }
}
