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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "all";

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

    // Build query
    const query: any = {
      deliveryPartnerId,
      status: { $in: ["delivered", "failed"] },
    };

    if (status !== "all") {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalCount = await Shipment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch history with populated order data
    const history = await Shipment.find(query)
      .populate({
        path: "orderId",
        select: "orderNumber shippingAddress items totalAmount",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate earnings (₹50 per delivered shipment)
    const historyWithEarnings = history.map((shipment: any) => ({
      ...shipment,
      earnings: shipment.status === "delivered" ? 50 : 0,
      completedAt: shipment.updatedAt,
    }));

    return NextResponse.json({
      history: historyWithEarnings,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery history" },
      { status: 500 },
    );
  }
}
