/**
 * API Route Protection Middleware
 * Protects routes by verifying JWT tokens and validating roles
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export interface ProtectedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer "
}

/**
 * Verify token middleware
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const token = extractToken(request);

      if (!token) {
        return NextResponse.json(
          { error: "Missing authorization token" },
          { status: 401 },
        );
      }

      const payload = verifyAccessToken(token);

      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 },
        );
      }

      // Attach user to request
      const requestWithUser = request as any;
      requestWithUser.user = payload;

      return handler(requestWithUser);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 },
      );
    }
  };
}

/**
 * Verify role-based access
 */
export function withRole(...roles: string[]) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      try {
        const token = extractToken(request);

        if (!token) {
          return NextResponse.json(
            { error: "Missing authorization token" },
            { status: 401 },
          );
        }

        const payload = verifyAccessToken(token);

        if (!payload) {
          return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 },
          );
        }

        if (!roles.includes(payload.role)) {
          return NextResponse.json(
            { error: `Access denied. Required roles: ${roles.join(", ")}` },
            { status: 403 },
          );
        }

        // Attach user to request
        const requestWithUser = request as any;
        requestWithUser.user = payload;

        return handler(requestWithUser);
      } catch (error) {
        console.error("Role verification error:", error);
        return NextResponse.json(
          { error: "Authorization failed" },
          { status: 500 },
        );
      }
    };
  };
}

/**
 * Extract user from request
 */
export function getUser(request: NextRequest): JWTPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyAccessToken(token);
}
