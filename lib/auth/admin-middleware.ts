import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload } from "./jwt";
import User from "@/lib/db/models/User";
import { AdminAudit } from "@/lib/db/models/AdminAudit";
import { connectDB } from "@/lib/db/connection";

type UserRole = "customer" | "admin" | "seller";

export interface AdminRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  adminId?: string;
}

interface AdminRequestHandler {
  (req: AdminRequest): Promise<NextResponse>;
}

/**
 * Middleware to protect routes and require specific roles
 */
export async function withRoleAuth(
  roles: UserRole[],
  handler: AdminRequestHandler,
) {
  return async (req: NextRequest) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized - Missing token" },
          { status: 401 },
        );
      }

      const payload = verifyAccessToken(token) as JWTPayload | null;
      if (!payload) {
        return NextResponse.json(
          { error: "Unauthorized - Invalid token" },
          { status: 401 },
        );
      }

      await connectDB();
      const user = await User.findById(payload.id);

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!roles.includes(user.role as UserRole)) {
        await logAdminAction({
          adminEmail: payload.email,
          adminId: payload.id,
          action: "unauthorized_access",
          entityType: "user",
          entityId: payload.id,
          status: "failed",
          errorMessage: `User attempted access without role: ${roles.join(", ")}`,
        });

        return NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 },
        );
      }

      (req as AdminRequest).user = {
        id: payload.id,
        email: payload.email,
        name: payload.name || user.name,
        role: user.role,
      };
      (req as AdminRequest).adminId = payload.id;

      return await handler(req as AdminRequest);
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Middleware to protect routes and require admin role
 */
export async function withAdminAuth(handler: AdminRequestHandler) {
  return withRoleAuth(["admin"], handler);
}

/**
 * Middleware to protect routes and require seller role
 */
export async function withSellerAuth(handler: AdminRequestHandler) {
  return withRoleAuth(["seller"], handler);
}

/**
 * Extract JWT token from request
 */
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction({
  adminEmail,
  adminId,
  action,
  entityType,
  entityId,
  changes,
  oldValues,
  newValues,
  status = "success",
  errorMessage,
  ipAddress,
  userAgent,
}: {
  adminEmail: string;
  adminId?: string;
  action: string;
  entityType: "order" | "product" | "user" | "refund" | "shipment";
  entityId: string;
  changes?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  status?: "success" | "failed";
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await connectDB();

    // Create audit log
    await AdminAudit.create({
      adminId,
      adminEmail,
      action,
      entityType,
      entityId,
      changes,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      status,
      errorMessage,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  try {
    await connectDB();
    const { Order } = await import("@/lib/db/models/Order");
    const { Product } = await import("@/lib/db/models/Product");
    const { Refund } = await import("@/lib/db/models/Refund");

    const [
      totalOrders,
      totalRevenue,
      activeOrders,
      totalProducts,
      pendingRefunds,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.countDocuments({
        orderStatus: { $in: ["pending", "confirmed", "processing"] },
      }),
      Product.countDocuments(),
      Refund.countDocuments({ status: "pending" }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      activeOrders,
      totalProducts,
      pendingRefunds,
    };
  } catch (error) {
    console.error("Failed to get admin stats:", error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      activeOrders: 0,
      totalProducts: 0,
      pendingRefunds: 0,
    };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    return user?.role === "admin";
  } catch {
    return false;
  }
}
