import { connect } from "@/lib/db/connection";
import Wishlist from "@/lib/db/models/Wishlist";
import { NextRequest, NextResponse } from "next/server";

// GET wishlist by user email
export async function GET(req: NextRequest) {
  try {
    await connect();

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter required" },
        { status: 400 },
      );
    }

    const wishlist = await Wishlist.findOne({ userEmail: email });
    if (!wishlist) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json({ wishlist }, { status: 200 });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create or update wishlist
export async function POST(req: NextRequest) {
  try {
    await connect();

    const { email, items } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    let wishlist = await Wishlist.findOne({ userEmail: email });
    if (!wishlist) {
      wishlist = new Wishlist({
        userEmail: email,
        items: items || [],
      });
    } else {
      wishlist.items = items || [];
    }

    await wishlist.save();

    return NextResponse.json(
      { message: "Wishlist saved successfully", wishlist },
      { status: 200 },
    );
  } catch (error) {
    console.error("Save wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Add/remove item from wishlist
export async function PUT(req: NextRequest) {
  try {
    await connect();

    const { email, product, action } = await req.json();
    if (!email || !product) {
      return NextResponse.json(
        { error: "Email and product required" },
        { status: 400 },
      );
    }

    let wishlist = await Wishlist.findOne({ userEmail: email });
    if (!wishlist) {
      wishlist = new Wishlist({
        userEmail: email,
        items: [],
      });
    }

    const existingItem = wishlist.items.find(
      (item: any) => item.productId === product.productId,
    );

    if (action === "add") {
      if (!existingItem) {
        wishlist.items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          addedAt: new Date(),
        });
      }
    } else if (action === "remove" || action === "toggle") {
      wishlist.items = wishlist.items.filter(
        (item: any) => item.productId !== product.productId,
      );
    }

    await wishlist.save();

    return NextResponse.json(
      { message: "Wishlist updated successfully", wishlist },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Clear wishlist
export async function DELETE(req: NextRequest) {
  try {
    await connect();

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { error: "Email query parameter required" },
        { status: 400 },
      );
    }

    await Wishlist.deleteOne({ userEmail: email });

    return NextResponse.json(
      { message: "Wishlist cleared successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete wishlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
