import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import Product from "@/lib/db/models/Product";
import Order from "@/lib/db/models/Order";
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

    if (!decoded || decoded.role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sellerId = decoded.userId;

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

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch product stats
    const totalProducts = await Product.countDocuments({ sellerId });
    const activeProducts = await Product.countDocuments({
      sellerId,
      isActive: true,
    });
    const lowStockProducts = await Product.countDocuments({
      sellerId,
      stock: { $lte: 10, $gt: 0 },
    });

    // Fetch orders containing seller's products
    const products = await Product.find({ sellerId }).select("_id");
    const productIds = products.map((p) => p._id);

    // Count orders with seller's products
    const allOrders = await Order.find({
      "items.productId": { $in: productIds },
    });

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(
      (order) =>
        order.orderStatus === "pending" || order.orderStatus === "processing",
    ).length;

    // Calculate revenue
    let totalRevenue = 0;
    let monthlyRevenue = 0;

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          productIds.some((id) => id.toString() === item.productId.toString())
        ) {
          const itemTotal = item.price * item.quantity;
          totalRevenue += itemTotal;

          // Check if order is from this month
          if (order.createdAt && order.createdAt >= startOfMonth) {
            monthlyRevenue += itemTotal;
          }
        }
      });
    });

    // Calculate average rating
    const productsWithRatings = await Product.find({
      sellerId,
      rating: { $exists: true, $gt: 0 },
    }).select("rating");

    const averageRating =
      productsWithRatings.length > 0
        ? productsWithRatings.reduce((sum, p) => sum + (p.rating || 0), 0) /
          productsWithRatings.length
        : 0;

    const stats = {
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      averageRating: Math.round(averageRating * 10) / 10,
      lowStockProducts,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller stats" },
      { status: 500 },
    );
  }
}
