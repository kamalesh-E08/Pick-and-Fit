import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, logAdminAction } from "@/lib/auth/admin-middleware";
import { getOrders, updateOrderStatus } from "@/lib/admin/dashboard";
import { csvResponse, toCsv } from "@/lib/admin/csv";

/**
 * GET /admin/api/orders - Get all orders with filters
 * POST /admin/api/orders/:id/status - Update order status
 */

async function GET(req: NextRequest, context: any) {
  return await withAdminAuth(async (request: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status") || undefined;
      const paymentStatus = searchParams.get("paymentStatus") || undefined;

      const isExport = searchParams.get("export") === "csv";
      const { orders, pagination } = await getOrders(
        isExport ? 1 : page,
        isExport ? 10000 : limit,
        {
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
        },
      );

      if (isExport) {
        const rows = orders.map((order: any) => ({
          orderNumber: order.orderNumber,
          customerName: order.shippingAddress?.name || "",
          total: order.total,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          orderDate: order.orderDate,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
        }));
        const csv = toCsv(rows, [
          "orderNumber",
          "customerName",
          "total",
          "orderStatus",
          "paymentStatus",
          "orderDate",
          "itemCount",
        ]);
        return csvResponse("orders.csv", csv);
      }

      return NextResponse.json({
        success: true,
        data: orders,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }
  });
}

async function POST(req: NextRequest, context: any) {
  return await withAdminAuth(async (request: any) => {
    try {
      const { orderId, status, notes } = await request.json();

      if (!orderId || !status) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const updatedOrder = await updateOrderStatus(orderId, status, notes);

      // Log the action
      await logAdminAction({
        adminEmail: request.user.email,
        adminId: request.user.id,
        action: "update_status",
        entityType: "order",
        entityId: orderId,
        newValues: { status, notes },
      });

      return NextResponse.json({
        success: true,
        message: "Order status updated",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 },
      );
    }
  });
}

export { GET, POST };
