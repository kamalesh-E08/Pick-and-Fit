import { connect } from "@/lib/db/connection";
import VirtualTryOn from "@/lib/db/models/VirtualTryOn";
import { NextRequest, NextResponse } from "next/server";

// GET /api/virtual-try-on/[id] - Get specific try-on
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const tryOn = await VirtualTryOn.findById(params.id).lean();

    if (!tryOn) {
      return NextResponse.json({ error: "Try-on not found" }, { status: 404 });
    }

    return NextResponse.json({ tryOn }, { status: 200 });
  } catch (error) {
    console.error("Get try-on error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/virtual-try-on/[id] - Delete try-on
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const tryOn = await VirtualTryOn.findByIdAndDelete(params.id);

    if (!tryOn) {
      return NextResponse.json({ error: "Try-on not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Try-on deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete try-on error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
