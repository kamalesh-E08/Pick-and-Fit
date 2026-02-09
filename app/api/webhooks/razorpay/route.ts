/**
 * Razorpay Webhook Handler
 * Processes payment events from Razorpay and updates order status
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/lib/db/models/Order";
import { connectDB } from "@/lib/db/connection";

interface RazorpayWebhookBody {
  event: string;
  created_at: number;
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        acquirer_data: Record<string, string>;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        offer_id: string | null;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
      };
    };
  };
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");

    return hash === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * POST /api/webhooks/razorpay
 * Receives and processes Razorpay webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 },
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.warn("Invalid webhook signature received");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse body
    const event = JSON.parse(body) as RazorpayWebhookBody;

    console.log(`[Webhook] Event received: ${event.event}`);

    // Connect to database
    await connectDB();

    // Handle different webhook events
    switch (event.event) {
      case "payment.authorized":
        await handlePaymentAuthorized(event);
        break;

      case "payment.failed":
        await handlePaymentFailed(event);
        break;

      case "payment.captured":
        await handlePaymentCaptured(event);
        break;

      case "refund.created":
        await handleRefundCreated(event);
        break;

      case "refund.failed":
        await handleRefundFailed(event);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      event: event.event,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Still return 200 to prevent Razorpay from retrying
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 200 },
    );
  }
}

/**
 * Handle payment.authorized event
 */
async function handlePaymentAuthorized(event: RazorpayWebhookBody) {
  try {
    const payment = event.payload.payment?.entity;
    if (!payment) return;

    const orderId = payment.notes?.orderId;
    if (!orderId) {
      console.warn("No orderId in payment notes");
      return;
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: "confirmed",
        paymentStatus: "authorized",
        paymentId: payment.id,
        paymentMethod: payment.method,
        transactionDate: new Date(),
      },
      { new: true },
    );

    if (!order) {
      console.warn(`Order not found: ${orderId}`);
      return;
    }

    console.log(`[Payment] Authorized for order: ${orderId}`);

    // TODO: Send confirmation email
    // await sendConfirmationEmail(order);
  } catch (error) {
    console.error("Error handling payment.authorized:", error);
    throw error;
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: RazorpayWebhookBody) {
  try {
    const payment = event.payload.payment?.entity;
    if (!payment) return;

    const orderId = payment.notes?.orderId;
    if (!orderId) {
      console.warn("No orderId in payment notes");
      return;
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: "cancelled",
        paymentStatus: "failed",
        paymentId: payment.id,
        paymentError: payment.error_description || "Payment failed",
      },
      { new: true },
    );

    if (!order) {
      console.warn(`Order not found: ${orderId}`);
      return;
    }

    console.log(`[Payment] Failed for order: ${orderId}`);

    // TODO: Send failure notification email
    // await sendPaymentFailureEmail(order);
  } catch (error) {
    console.error("Error handling payment.failed:", error);
    throw error;
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(event: RazorpayWebhookBody) {
  try {
    const payment = event.payload.payment?.entity;
    if (!payment) return;

    const orderId = payment.notes?.orderId;
    if (!orderId) {
      console.warn("No orderId in payment notes");
      return;
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: "processing",
        paymentStatus: "completed",
        paymentId: payment.id,
      },
      { new: true },
    );

    if (!order) {
      console.warn(`Order not found: ${orderId}`);
      return;
    }

    console.log(`[Payment] Captured for order: ${orderId}`);

    // TODO: Trigger order processing workflow
    // TODO: Send order confirmation email
    // await sendOrderConfirmationEmail(order);
  } catch (error) {
    console.error("Error handling payment.captured:", error);
    throw error;
  }
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(event: RazorpayWebhookBody) {
  try {
    const order = event.payload.order?.entity;
    if (!order) return;

    const orderId = order.notes?.orderId;
    if (!orderId) {
      console.warn("No orderId in order notes");
      return;
    }

    console.log(`[Refund] Created for order: ${orderId}`);

    // TODO: Update order with refund status
    // TODO: Send refund confirmation email
  } catch (error) {
    console.error("Error handling refund.created:", error);
    throw error;
  }
}

/**
 * Handle refund.failed event
 */
async function handleRefundFailed(event: RazorpayWebhookBody) {
  try {
    const order = event.payload.order?.entity;
    if (!order) return;

    const orderId = order.notes?.orderId;
    if (!orderId) {
      console.warn("No orderId in order notes");
      return;
    }

    console.log(`[Refund] Failed for order: ${orderId}`);

    // TODO: Log refund failure
    // TODO: Send alert to support team
  } catch (error) {
    console.error("Error handling refund.failed:", error);
    throw error;
  }
}

/**
 * GET /api/webhooks/razorpay
 * Health check / documentation
 */
export async function GET() {
  return NextResponse.json({
    message: "Razorpay webhook endpoint",
    method: "POST",
    supportedEvents: [
      "payment.authorized",
      "payment.failed",
      "payment.captured",
      "refund.created",
      "refund.failed",
    ],
    documentation: "https://razorpay.com/docs/webhooks/",
  });
}
