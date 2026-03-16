import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth/admin-middleware";
import { connectDB } from "@/lib/db/connection";
import Product from "@/lib/db/models/Product";
import Order from "@/lib/db/models/Order";

async function GET(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      await connectDB();

      const sellerId = request.user.id;
      const sellerProducts = await Product.find({ sellerId }).select("_id");
      const productIds = sellerProducts.map((product) => product._id);

      if (productIds.length === 0) {
        return NextResponse.json({
          success: true,
          notifications: [],
          pendingCount: 0,
        });
      }

      const orders = await Order.find({
        "items.productId": { $in: productIds },
      })
        .sort({ orderDate: -1 })
        .limit(20)
        .lean();

      const productIdSet = new Set(productIds.map((id) => id.toString()));

      const notifications = orders.map((order: any) => {
        const sellerItems = (order.items || []).filter((item: any) =>
          productIdSet.has(item.productId?.toString()),
        );

        const sellerTotal = sellerItems.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0,
        );

        return {
          id: order._id.toString(),
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          orderDate: order.orderDate,
          customerName: order.shippingAddress?.name || "Customer",
          itemCount: sellerItems.length,
          sellerTotal,
          title: `New order #${order.orderNumber}`,
          message: `${sellerItems.length} item(s) | ₹${sellerTotal.toLocaleString("en-IN")}`,
        };
      });

      const pendingCount = notifications.filter((item: any) =>
        ["pending", "confirmed", "processing"].includes(item.orderStatus),
      ).length;

      return NextResponse.json({
        success: true,
        notifications,
        pendingCount,
      });
    } catch (error) {
      console.error("Error fetching seller notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }
  });

  return handler(req);
}

export { GET };
