import { connect } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTokenPair } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error("Login error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const { email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role || "customer",
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || "customer",
        },
        tokens,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
