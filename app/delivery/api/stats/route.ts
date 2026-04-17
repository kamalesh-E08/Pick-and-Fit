import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      await connect();
    } catch (connErr) {
      console.error("Delivery stats error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    const deliveryPartnerId = decoded.userId;

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
