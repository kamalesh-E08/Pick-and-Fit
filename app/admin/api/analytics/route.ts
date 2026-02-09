import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/admin-middleware";
import { getDashboardAnalytics } from "@/lib/admin/dashboard";

/**
 * GET /admin/api/analytics - Get dashboard analytics
 */

async function GET(req: NextRequest, context: any) {
  const handler = await withAdminAuth(async (request: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const dateRange = parseInt(searchParams.get("dateRange") || "30");

      const analytics = await getDashboardAnalytics(dateRange);

      return NextResponse.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

export { GET };
