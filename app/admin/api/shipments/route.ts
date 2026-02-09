import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, logAdminAction } from "@/lib/auth/admin-middleware";
import { getShipments, createShipment } from "@/lib/admin/dashboard";
import { csvResponse, toCsv } from "@/lib/admin/csv";

/**
 * GET /admin/api/shipments - Get all shipments with filters
 * POST /admin/api/shipments - Create new shipment
 */

async function GET(req: NextRequest, context: any) {
  const handler = await withAdminAuth(async (request: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status") || undefined;
      const carrier = searchParams.get("carrier") || undefined;

      const isExport = searchParams.get("export") === "csv";
      const { shipments, pagination } = await getShipments(
        isExport ? 1 : page,
        isExport ? 10000 : limit,
        {
          status: status || undefined,
          carrier: carrier || undefined,
        },
      );

      if (isExport) {
        const rows = shipments.map((shipment: any) => ({
          orderNumber: shipment.orderNumber,
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery,
          shippedDate: shipment.shippedDate,
        }));
        const csv = toCsv(rows, [
          "orderNumber",
          "trackingNumber",
          "carrier",
          "status",
          "estimatedDelivery",
          "shippedDate",
        ]);
        return csvResponse("shipments.csv", csv);
      }

      return NextResponse.json({
        success: true,
        data: shipments,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching shipments:", error);
      return NextResponse.json(
        { error: "Failed to fetch shipments" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

async function POST(req: NextRequest, context: any) {
  const handler = await withAdminAuth(async (request: any) => {
    try {
      const shipmentData = await request.json();

      if (!shipmentData.orderId || !shipmentData.trackingNumber) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const newShipment = await createShipment(shipmentData);

      // Log the action
      await logAdminAction({
        adminEmail: request.user.email,
        adminId: request.user.id,
        action: "create",
        entityType: "shipment",
        entityId: newShipment._id.toString(),
        newValues: shipmentData,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Shipment created successfully",
          data: newShipment,
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("Error creating shipment:", error);
      return NextResponse.json(
        { error: "Failed to create shipment" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}
export { GET, POST };
