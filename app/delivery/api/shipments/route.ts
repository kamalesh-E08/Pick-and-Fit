import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";
import Order from "@/lib/db/models/Order";
import { verifyAccessToken } from "@/lib/auth/jwt";

const VALID_STATUSES = [
  "pending",
  "picked",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
] as const;

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
      console.error("Delivery shipments error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    const deliveryPartnerId = decoded.userId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    let query: any = { deliveryPartnerId };

    if (status === "active") {
      query.status = {
        $in: ["pending", "picked", "in_transit", "out_for_delivery"],
      };
    } else if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, "i") },
        { trackingNumber: new RegExp(search, "i") },
      ];
    }

    const shipments = await Shipment.find(query)
      .populate({
        path: "orderId",
        select: "orderNumber shippingAddress",
      })
      .sort({ estimatedDelivery: 1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Transform data to include shipping address from order
    const transformedShipments = shipments.map((shipment: any) => ({
      _id: shipment._id,
      orderNumber: shipment.orderId?.orderNumber || shipment.orderNumber,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      currentLocation: shipment.currentLocation,
      carrier: shipment.carrier,
      cost: shipment.cost,
      shippingAddress: shipment.orderId?.shippingAddress || {},
      events: shipment.events || [],
      deliveryProof: shipment.deliveryProof,
      notes: shipment.notes,
    }));

    const total = await Shipment.countDocuments(query);

    return NextResponse.json({
      shipments: transformedShipments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Delivery shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 },
    );
  }
}

// Update shipment status
export async function PUT(req: NextRequest) {
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
      console.error("Update shipment error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    const deliveryPartnerId = decoded.userId;

    const body = await req.json();
    const { shipmentId, status, currentLocation, deliveryProof, notes, note } =
      body;

    if (!shipmentId || !status) {
      return NextResponse.json(
        { error: "Shipment ID and status are required" },
        { status: 400 },
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid shipment status" },
        { status: 400 },
      );
    }

    const resolvedNote = notes || note;

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (currentLocation) updateData.currentLocation = currentLocation;
    if (resolvedNote) updateData.notes = resolvedNote;
    if (status === "delivered") {
      updateData.actualDelivery = new Date();
      if (deliveryProof) {
        updateData.deliveryProof =
          typeof deliveryProof === "string"
            ? {
                imageUrl: deliveryProof,
                timestamp: new Date(),
              }
            : {
                ...deliveryProof,
                timestamp: deliveryProof.timestamp || new Date(),
              };
      }
    }

    // Add event to tracking
    const event = {
      status,
      timestamp: new Date(),
      location: currentLocation || "",
      description: resolvedNote || `Status updated to ${status}`,
    };

    const shipment = await Shipment.findOneAndUpdate(
      { _id: shipmentId, deliveryPartnerId },
      {
        $set: updateData,
        $push: { events: event },
      },
      { new: true },
    );

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update corresponding order status
    if (status === "delivered") {
      await Order.findOneAndUpdate(
        { orderNumber: shipment.orderNumber },
        {
          orderStatus: "delivered",
          deliveredAt: new Date(),
        },
      );
    } else if (["picked", "in_transit", "out_for_delivery"].includes(status)) {
      await Order.findOneAndUpdate(
        { orderNumber: shipment.orderNumber },
        { orderStatus: "shipped" },
      );
    }

    return NextResponse.json({
      message: "Shipment updated successfully",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 },
    );
  }
}
