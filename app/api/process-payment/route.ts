/**
 * Process Payment Endpoint
 * Handles payment verification and order status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendPaymentReceiptEmail } from "@/lib/services/email";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay configuration missing: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

interface PaymentVerification {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  amount: number;
  userEmail?: string;
}

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  try {
    const hmac = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || "",
    );
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * POST /api/process-payment
 * Process and verify payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentVerification;

    // Validate required fields
    if (!body.orderId || !body.amount) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectDB();

    // Find the order
    const order = await Order.findById(body.orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify amount matches
    const expectedAmount = Math.round(order.totalAmount * 100) / 100; // Normalize
    if (Math.abs(expectedAmount - body.amount) > 0.01) {
      console.warn(
        `Amount mismatch for order ${body.orderId}: expected ${expectedAmount}, got ${body.amount}`,
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    let paymentStatus = "pending";
    let paymentError = null;

    // If Razorpay payment details are provided, verify them
    if (
      body.razorpayPaymentId &&
      body.razorpayOrderId &&
      body.razorpaySignature
    ) {
      // Verify signature
      const isSignatureValid = verifyPaymentSignature(
        body.razorpayOrderId,
        body.razorpayPaymentId,
        body.razorpaySignature,
      );

      if (!isSignatureValid) {
        console.error(
          "Invalid payment signature for payment:",
          body.razorpayPaymentId,
        );
        return NextResponse.json(
          { error: "Payment verification failed: Invalid signature" },
          { status: 401 },
        );
      }

      try {
        // Fetch payment details from Razorpay API
        const razorpay = getRazorpay();
        const payment = await razorpay.payments.fetch(body.razorpayPaymentId);

        // Verify payment status
        if (payment.status === "captured") {
          paymentStatus = "completed";
        } else if (payment.status === "authorized") {
          paymentStatus = "authorized";
        } else if (payment.status === "failed") {
          paymentStatus = "failed";
          paymentError = payment.error_description || "Payment failed";
          return NextResponse.json(
            { error: "Payment failed", message: paymentError },
            { status: 400 },
          );
        } else {
          paymentStatus = payment.status;
        }

        // Update order with payment details
        order.paymentId = body.razorpayPaymentId;
        order.razorpayOrderId = body.razorpayOrderId;
        order.paymentStatus = paymentStatus;
      } catch (error) {
        console.error("Error fetching payment from Razorpay:", error);
        return NextResponse.json(
          { error: "Failed to verify payment with gateway" },
          { status: 500 },
        );
      }
    }

    // Update order status based on payment status
    if (paymentStatus === "completed" || paymentStatus === "authorized") {
      order.orderStatus = "confirmed";

      // Add tracking event
      if (!order.trackingEvents) {
        order.trackingEvents = [];
      }

      order.trackingEvents.push({
        status: "confirmed",
        timestamp: new Date(),
        location: "Order Processing Center",
        description: "Payment received. Order confirmed and being processed.",
      });

      // Set estimated delivery (3-5 business days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      order.estimatedDelivery = deliveryDate;
    } else if (paymentStatus === "failed") {
      order.orderStatus = "cancelled";
      order.paymentError = paymentError;
    }

    // Save updated order
    await order.save();

    // Send payment receipt email
    if (
      body.userEmail &&
      (paymentStatus === "completed" || paymentStatus === "authorized")
    ) {
      await sendPaymentReceiptEmail(
        body.orderId,
        body.userEmail,
        body.razorpayPaymentId || "N/A",
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      orderId: order._id,
      paymentId: body.razorpayPaymentId || "N/A",
      paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error("Payment processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process payment";

    return NextResponse.json(
      {
        error: "Payment processing failed",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/process-payment
 * Health check / documentation
 */
export async function GET() {
  return NextResponse.json({
    message: "Payment processing endpoint",
    method: "POST",
    description: "Processes and verifies payments using Razorpay",
    requestBody: {
      orderId: "string (required) - Order ID",
      amount: "number (required) - Amount in rupees",
      razorpayPaymentId: "string (optional) - Razorpay payment ID",
      razorpayOrderId: "string (optional) - Razorpay order ID",
      razorpaySignature: "string (optional) - Razorpay signature",
      userEmail: "string (optional) - User email for receipt",
    },
  });
}
