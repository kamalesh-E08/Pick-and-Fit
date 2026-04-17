import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import { sendPaymentReceiptEmail } from "@/lib/services/email";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!stripeSecretKey) {
    throw new Error("Stripe configuration missing: set STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2023-08-16",
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")?.trim();
    const orderId = searchParams.get("orderId")?.trim();

    if (!sessionId || !orderId) {
      return NextResponse.json(
        { error: "sessionId and orderId query parameters are required" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment not completed",
          paymentStatus: session?.payment_status,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentIntent = session.payment_intent as
      | Stripe.PaymentIntent
      | string
      | null;
    const paymentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentMethod = "card";
    if (paymentId) {
      order.paymentId = paymentId;
    }

    if (!order.trackingEvents) {
      order.trackingEvents = [];
    }
    order.trackingEvents.push({
      status: "confirmed",
      timestamp: new Date(),
      location: "Order Processing Center",
      description:
        "Payment received via Stripe. Order confirmed and being processed.",
    });

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    order.estimatedDelivery = deliveryDate;

    await order.save();

    if (order.userEmail) {
      await sendPaymentReceiptEmail(
        orderId,
        order.userEmail,
        paymentId || "N/A",
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId: order._id,
        paymentId,
        paymentStatus: session.payment_status,
        orderStatus: order.orderStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Stripe verify-checkout-session error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify Stripe checkout session",
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
