import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, logAdminAction } from "@/lib/auth/admin-middleware";
import { getRefunds, processRefund } from "@/lib/admin/dashboard";
import { csvResponse, toCsv } from "@/lib/admin/csv";

/**
 * GET /admin/api/refunds - Get all refunds with filters
 * POST /admin/api/refunds/:id/process - Approve or reject refund
 */

const GET = withAdminAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;

    const isExport = searchParams.get("export") === "csv";
    const { refunds, pagination } = await getRefunds(
      isExport ? 1 : page,
      isExport ? 10000 : limit,
      {
        status: status || undefined,
      },
    );

    if (isExport) {
      const rows = refunds.map((refund: any) => ({
        orderNumber: refund.orderNumber,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        requestDate: refund.requestDate,
        customerName: refund.userId?.name || "",
        customerEmail: refund.userId?.email || "",
      }));
      const csv = toCsv(rows, [
        "orderNumber",
        "amount",
        "status",
        "reason",
        "requestDate",
        "customerName",
        "customerEmail",
      ]);
      return csvResponse("refunds.csv", csv);
    }

    return NextResponse.json({
      success: true,
      data: refunds,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 },
    );
  }
});

const POST = withAdminAuth(async (request: any) => {
  try {
    const { refundId, action, notes, transactionId } = await request.json();

    if (!refundId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updatedRefund = await processRefund(
      refundId,
      action,
      notes,
      transactionId,
    );

    // Log the action
    await logAdminAction({
      adminEmail: request.user.email,
      adminId: request.user.id,
      action: "refund",
      entityType: "refund",
      entityId: refundId,
      newValues: { action, status: updatedRefund.status },
    });

    return NextResponse.json({
      success: true,
      message: `Refund ${action}ed successfully`,
      data: updatedRefund,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 },
    );
  }
});

export { GET, POST };
