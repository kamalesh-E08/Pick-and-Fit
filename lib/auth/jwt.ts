/**
 * JWT Token Management
 * Handles token generation, verification, and refresh logic
 */

import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "user" | "admin" | "seller";
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";
const ACCESS_EXPIRE = process.env.JWT_EXPIRE || "7d";
const REFRESH_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || "30d";

/**
 * Generate JWT access token
 */
export function generateAccessToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRE,
    algorithm: "HS256",
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  const options: SignOptions = {
    expiresIn: REFRESH_EXPIRE,
    algorithm: "HS256",
  };

  return jwt.sign(payload, REFRESH_SECRET, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  payload: Omit<JWTPayload, "iat" | "exp">,
): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: ["HS256"],
    };

    const decoded = jwt.verify(token, JWT_SECRET, options) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const options: VerifyOptions = {
      algorithms: ["HS256"],
    };

    const decoded = jwt.verify(token, REFRESH_SECRET, options) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;

  const { userId, email, role } = payload;
  return generateAccessToken({ userId, email, role });
}

/**
 * Decode token without verification (use cautiously)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
  } catch (error) {
    console.error("Token decode failed:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return false;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return true;
    }
    return false;
  }
}

/**
 * Get remaining time in seconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const remainingTime = expirationTime - currentTime;

  return remainingTime > 0 ? Math.floor(remainingTime / 1000) : 0;
}
