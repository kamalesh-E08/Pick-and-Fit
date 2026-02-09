import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET endpoint to retrieve user's stored photo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId parameter required" },
        { status: 400 },
      );
    }

    const photoPath = path.join(
      process.cwd(),
      ".data",
      "user-photos",
      `${photoId}.jpg`,
    );

    if (!fs.existsSync(photoPath)) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const photoBuffer = fs.readFileSync(photoPath);

    return new NextResponse(photoBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error retrieving photo:", error);
    return NextResponse.json(
      { error: "Failed to retrieve photo" },
      { status: 500 },
    );
  }
}
