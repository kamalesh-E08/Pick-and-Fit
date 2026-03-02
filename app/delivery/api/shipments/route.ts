import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Shipment from "@/lib/db/models/Shipment";
import Order from "@/lib/db/models/Order";

export async function GET(req: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error("Delivery shipments error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    const deliveryPartnerId = req.headers.get("x-user-id");

    if (!deliveryPartnerId) {
      return NextResponse.json(
        { error: "Unauthorized - Delivery partner ID required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
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
      orderNumber: shipment.orderNumber,
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
    try {
      await connect();
    } catch (connErr) {
      console.error("Update shipment error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 },
      );
    }

    const deliveryPartnerId = req.headers.get("x-user-id");

    if (!deliveryPartnerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { shipmentId, status, currentLocation, deliveryProof, notes } = body;

    if (!shipmentId || !status) {
      return NextResponse.json(
        { error: "Shipment ID and status are required" },
        { status: 400 },
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (currentLocation) updateData.currentLocation = currentLocation;
    if (notes) updateData.notes = notes;
    if (status === "delivered") {
      updateData.actualDelivery = new Date();
      if (deliveryProof) updateData.deliveryProof = deliveryProof;
    }

    // Add event to tracking
    const event = {
      status,
      timestamp: new Date(),
      location: currentLocation || "",
      description: notes || `Status updated to ${status}`,
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
    } else if (status === "out_for_delivery") {
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
