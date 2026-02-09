import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth } from "@/lib/auth/admin-middleware";
import { getSellerOrders } from "@/lib/admin/dashboard";

/**
 * GET /seller/api/orders - Get orders containing seller products only
 */

async function GET(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status") || undefined;
      const paymentStatus = searchParams.get("paymentStatus") || undefined;
      const search = searchParams.get("search") || undefined;

      const { orders, pagination } = await getSellerOrders(
        request.user.id,
        page,
        limit,
        {
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          search: search || undefined,
        },
      );

      return NextResponse.json({
        success: true,
        data: orders,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

export { GET };
