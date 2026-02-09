import { connect } from "@/lib/db/connection";
import Cart from "@/lib/db/models/Cart";
import { NextRequest, NextResponse } from "next/server";

// GET cart by user email
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

    const cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      return NextResponse.json({ items: [], subtotal: 0 }, { status: 200 });
    }

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create or update cart
export async function POST(req: NextRequest) {
  try {
    await connect();

    const { email, items } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = new Cart({
        userEmail: email,
        items: items || [],
      });
    } else {
      cart.items = items || [];
    }

    await cart.save();

    return NextResponse.json(
      { message: "Cart saved successfully", cart },
      { status: 200 },
    );
  } catch (error) {
    console.error("Save cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Add/update item in cart
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

    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = new Cart({
        userEmail: email,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item: any) => item.productId === product.productId,
    );

    if (action === "add") {
      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        cart.items.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: product.quantity || 1,
        });
      }
    } else if (action === "remove") {
      cart.items = cart.items.filter(
        (item: any) => item.productId !== product.productId,
      );
    } else if (action === "update") {
      if (existingItem) {
        existingItem.quantity = product.quantity;
      }
    }

    await cart.save();

    return NextResponse.json(
      { message: "Cart updated successfully", cart },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Clear cart
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

    await Cart.deleteOne({ userEmail: email });

    return NextResponse.json(
      { message: "Cart cleared successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
