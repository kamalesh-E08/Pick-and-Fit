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
      console.error("Signup error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "Database service unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const { name, email, password, role } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate role
    const validRoles = ["customer", "seller", "admin", "delivery"];
    const userRole = role && validRoles.includes(role) ? role : "customer";

    // Prevent unauthorized admin creation
    if (userRole === "admin" && !email.endsWith("@pickandfit.com")) {
      return NextResponse.json(
        { error: "Admin accounts can only be created with company email" },
        { status: 403 },
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
    });

    await user.save();

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role || "customer",
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || "customer",
        },
        tokens,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
