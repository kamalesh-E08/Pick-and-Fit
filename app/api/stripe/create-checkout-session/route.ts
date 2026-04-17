import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!stripeSecretKey) {
    throw new Error("Stripe configuration missing: set STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = body?.orderId;
    const currency = body?.currency || "INR";

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 },
      );
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/payment?success=true&session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`;
    const cancelUrl = `${origin}/payment?orderId=${order._id}&cancel=true`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Pick & Fit Order ${order.orderNumber}`,
              description: `Order ${order.orderNumber}`,
            },
            unit_amount: Math.round(order.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: order.userEmail || undefined,
      metadata: {
        orderId: order._id.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        metadata: {
          orderId: order._id.toString(),
        },
      },
    });

    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (error) {
    console.error("Stripe create-checkout-session error:", error);
    return NextResponse.json(
      {
        error: "Failed to create Stripe checkout session",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : undefined
            : undefined,
      },
      { status: 500 },
    );
  }
}
