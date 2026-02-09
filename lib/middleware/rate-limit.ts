/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting requests per IP/User
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return request.ip || "unknown";
}

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const clientIP = getClientIP(request);
  return `ip:${clientIP}`;
}

/**
 * Check if request exceeds rate limit
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const current = rateLimitStore[identifier];

  if (!current || current.resetTime < now) {
    // Reset window
    rateLimitStore[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: rateLimitStore[identifier].resetTime,
    };
  }

  // Check if limit exceeded
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;

  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Rate limiting middleware factory
 */
export function withRateLimit(
  requestsPerWindow: number = 100,
  windowMs: number = 60 * 1000, // 1 minute default
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      // Skip rate limiting for certain IPs (localhost during development)
      if (process.env.NODE_ENV === "development") {
        const clientIP = getClientIP(request);
        if (clientIP === "::1" || clientIP === "127.0.0.1") {
          return handler(request);
        }
      }

      const identifier = getIdentifier(request);
      const result = checkRateLimit(identifier, requestsPerWindow, windowMs);

      const response = await handler(request);

      // Add rate limit headers
      const headers = new Headers(response.headers);
      headers.set("X-RateLimit-Limit", requestsPerWindow.toString());
      headers.set("X-RateLimit-Remaining", result.remaining.toString());
      headers.set(
        "X-RateLimit-Reset",
        Math.ceil(result.resetTime / 1000).toString(),
      );

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers,
          },
        );
      }

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
}

/**
 * Per-user rate limit (requires authentication)
 */
export function withPerUserRateLimit(
  requestsPerWindow: number = 1000,
  windowMs: number = 60 * 60 * 1000, // 1 hour default
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      // Extract user ID from auth token or request
      // This assumes you have user context somehow
      const identifier = getIdentifier(request);
      const result = checkRateLimit(identifier, requestsPerWindow, windowMs);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          { status: 429 },
        );
      }

      return handler(request);
    };
  };
}

/**
 * Cleanup old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

// Cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Global rate limit configurations
 */
export const RATE_LIMITS = {
  // API endpoints
  default: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || "100"),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"), // 1 minute
  },

  // Authentication endpoints (stricter)
  auth: {
    requests: 5,
    window: 15 * 60 * 1000, // 15 minutes
  },

  // Payment endpoints (very strict)
  payment: {
    requests: 3,
    window: 60 * 60 * 1000, // 1 hour
  },

  // Search endpoints (more lenient)
  search: {
    requests: 300,
    window: 60 * 1000, // 1 minute
  },

  // Public endpoints (most lenient)
  public: {
    requests: 1000,
    window: 60 * 1000, // 1 minute
  },
};
