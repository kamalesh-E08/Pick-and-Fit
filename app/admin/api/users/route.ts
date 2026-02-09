import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/admin-middleware";
import { getUsers } from "@/lib/admin/dashboard";
import { csvResponse, toCsv } from "@/lib/admin/csv";

/**
 * GET /admin/api/users - Get all users with filters
 */

const GET = withAdminAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role") || undefined;
    const search = searchParams.get("search") || undefined;

    const isExport = searchParams.get("export") === "csv";
    const { users, pagination } = await getUsers(
      isExport ? 1 : page,
      isExport ? 10000 : limit,
      {
        role: role || undefined,
        search: search || undefined,
      },
    );

    if (isExport) {
      const rows = users.map((user: any) => ({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      }));
      const csv = toCsv(rows, [
        "name",
        "email",
        "phone",
        "role",
        "isVerified",
        "createdAt",
      ]);
      return csvResponse("users.csv", csv);
    }

    return NextResponse.json({
      success: true,
      data: users,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
});

export { GET };
