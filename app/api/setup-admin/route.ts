/**
 * Admin Setup API - Run once to create admin and seller users
 * Access: http://localhost:3000/api/setup-admin
 */

import { connect } from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await connect();

    const users = [
      {
        name: "Admin User",
        email: "admin@pickfit.com",
        password: "admin123",
        role: "admin",
      },
      {
        name: "Seller User",
        email: "seller@pickfit.com",
        password: "seller123",
        role: "seller",
      },
      {
        name: "Customer User",
        email: "customer@pickfit.com",
        password: "customer123",
        role: "customer",
      },
    ];

    const results = [];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          createdAt: new Date(),
        });
        await user.save();
        results.push({
          status: "created",
          email: userData.email,
          password: userData.password,
          role: userData.role,
        });
      } else {
        results.push({
          status: "already_exists",
          email: userData.email,
          role: userData.role,
        });
      }
    }

    return NextResponse.json({
      message: "Setup complete",
      results,
      credentials: {
        admin: "admin@pickfit.com / admin123",
        seller: "seller@pickfit.com / seller123",
        customer: "customer@pickfit.com / customer123",
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup users" },
      { status: 500 }
    );
  }
}
