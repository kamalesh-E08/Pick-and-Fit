import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const shipmentId = params.id;

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

    // Fetch shipment with order details
    const shipment = await Shipment.findOne({
      _id: shipmentId,
      deliveryPartnerId,
    }).populate({
      path: "orderId",
      select: "orderNumber shippingAddress items",
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 },
    );
  }
}
