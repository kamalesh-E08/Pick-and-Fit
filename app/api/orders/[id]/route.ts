import { connect } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import { NextRequest, NextResponse } from "next/server";

// GET /api/orders/[id] - Get specific order details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const order = await Order.findById(params.id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
