import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import PhotoProfile from "@/lib/db/models/PhotoProfile";

// GET - List all photo profiles for user
export async function GET(request: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      // Log connection errors but allow reads to return an empty list
      console.error(
        "MongoDB connect failed (falling back to empty profiles):",
        connErr,
      );
      const { searchParams } = new URL(request.url);
      const email = searchParams.get("email");
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 },
        );
      }
      return NextResponse.json({
        profiles: [],
        warning: "MongoDB unavailable",
      });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const profiles = await PhotoProfile.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("GET photo profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photo profiles" },
      { status: 500 },
    );
  }
}

// POST - Create new photo profile
export async function POST(request: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error("POST photo profile error - MongoDB unavailable:", connErr);
      return NextResponse.json(
        { error: "MongoDB unavailable" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { userId, userEmail, personName, photoUrl, description } = body;

    if (!userEmail || !personName || !photoUrl) {
      return NextResponse.json(
        { error: "Email, person name, and photo are required" },
        { status: 400 },
      );
    }

    const profile = await PhotoProfile.create({
      userId,
      userEmail,
      personName,
      photoUrl,
      description: description || "",
    });

    return NextResponse.json({
      message: "Photo profile created",
      profile,
    });
  } catch (error) {
    console.error("POST photo profile error:", error);
    return NextResponse.json(
      { error: "Failed to create photo profile" },
      { status: 500 },
    );
  }
}

// DELETE - Delete photo profile
export async function DELETE(request: NextRequest) {
  try {
    try {
      await connect();
    } catch (connErr) {
      console.error(
        "DELETE photo profile error - MongoDB unavailable:",
        connErr,
      );
      return NextResponse.json(
        { error: "MongoDB unavailable" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 },
      );
    }

    await PhotoProfile.findByIdAndDelete(id);

    return NextResponse.json({ message: "Photo profile deleted" });
  } catch (error) {
    console.error("DELETE photo profile error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo profile" },
      { status: 500 },
    );
  }
}
