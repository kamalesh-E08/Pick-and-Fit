import { connect } from "@/lib/db/connection";
import VirtualTryOn from "@/lib/db/models/VirtualTryOn";
import { NextRequest, NextResponse } from "next/server";

// GET /api/virtual-try-on - List user's try-on history
export async function GET(req: NextRequest) {
  try {
    await connect();

    const userEmail = req.nextUrl.searchParams.get("email");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 },
      );
    }

    const tryOns = await VirtualTryOn.find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await VirtualTryOn.countDocuments({ userEmail });

    return NextResponse.json(
      {
        tryOns,
        pagination: { total, limit, skip, hasMore: skip + limit < total },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get try-ons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/virtual-try-on - Create new try-on session
export async function POST(req: NextRequest) {
  try {
    await connect();

    const {
      userId,
      userEmail,
      productId,
      productName,
      photoProfileId,
      personName,
      uploadedImageUrl,
      matchScore,
      feedback,
    } = await req.json();

    // Validation
    if (
      !userEmail ||
      !productId ||
      !uploadedImageUrl ||
      !photoProfileId ||
      !personName
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate match score if provided
    if (matchScore !== undefined && (matchScore < 0 || matchScore > 100)) {
      return NextResponse.json(
        { error: "Match score must be between 0 and 100" },
        { status: 400 },
      );
    }

    const tryOn = new VirtualTryOn({
      userId,
      userEmail,
      productId,
      productName,
      photoProfileId,
      personName,
      uploadedImageUrl,
      matchScore: matchScore || 0,
      feedback: feedback || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tryOn.save();

    return NextResponse.json(
      {
        message: "Try-on session created",
        tryOn: {
          id: tryOn._id,
          productName: tryOn.productName,
          matchScore: tryOn.matchScore,
          createdAt: tryOn.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create try-on error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/virtual-try-on - Update try-on session
export async function PUT(req: NextRequest) {
  try {
    await connect();

    const { tryOnId, tryOnImageUrl, matchScore, feedback } = await req.json();

    if (!tryOnId) {
      return NextResponse.json(
        { error: "Try-on ID required" },
        { status: 400 },
      );
    }

    const updateData: any = { updatedAt: new Date() };

    if (tryOnImageUrl) updateData.tryOnImageUrl = tryOnImageUrl;
    if (matchScore !== undefined) updateData.matchScore = matchScore;
    if (feedback !== undefined) updateData.feedback = feedback;

    const tryOn = await VirtualTryOn.findByIdAndUpdate(tryOnId, updateData, {
      new: true,
    });

    if (!tryOn) {
      return NextResponse.json({ error: "Try-on not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Try-on updated", tryOn },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update try-on error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
