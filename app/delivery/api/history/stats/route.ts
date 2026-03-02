import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const deliveryPartnerId = decoded.userId;

    // Connect to MongoDB
    try {
      await connect();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    // Calculate stats
    const totalDeliveries = await Shipment.countDocuments({
      deliveryPartnerId,
      status: { $in: ["delivered", "failed"] },
    });

    const completedDeliveries = await Shipment.countDocuments({
      deliveryPartnerId,
      status: "delivered",
    });

    const failedDeliveries = await Shipment.countDocuments({
      deliveryPartnerId,
      status: "failed",
    });

    // Calculate total earnings (₹50 per delivered shipment)
    const totalEarnings = completedDeliveries * 50;

    const stats = {
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      totalEarnings,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching history stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch history stats" },
      { status: 500 },
    );
  }
}
