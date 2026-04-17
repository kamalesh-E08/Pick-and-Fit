import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connect } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { sendPasswordResetEmail } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error("Forgot password error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Always return the same success response to prevent email enumeration.
    const genericResponse = {
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(normalizedEmail, rawToken);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 },
    );
  }
}
