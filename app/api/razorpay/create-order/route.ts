/**
 * Razorpay Order Creation Endpoint
 * Creates a payment order in Razorpay and returns details for client-side payment
 */

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

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

export interface CreateOrderRequest {
  orderId: string;
  amount: number; // in paise (multiply INR by 100)
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string; // Razorpay order ID
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * POST /api/razorpay/create-order
 * Creates a new payment order in Razorpay
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderRequest;

    // Validate required fields
    if (!body.orderId || !body.amount) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount" },
        { status: 400 },
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 },
      );
    }

    // Create order in Razorpay
    const options = {
      amount: body.amount, // in paise
      currency: body.currency || process.env.DEFAULT_CURRENCY || "INR",
      receipt: body.orderId, // Your order ID
      description: body.description || "Pick and Fit - Order Payment",
      notes: {
        orderId: body.orderId,
        ...body.notes,
      },
      ...(body.customerEmail && { customer_notify: 1 }), // Send SMS/Email to customer
    };

    const razorpay = getRazorpay();
    const order = (await razorpay.orders.create(
      options,
    )) as RazorpayOrderResponse;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Client-side key
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to create order";

    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/razorpay/create-order
 * Health check / documentation
 */
export async function GET() {
  return NextResponse.json({
    message: "Razorpay order creation endpoint",
    method: "POST",
    requestBody: {
      orderId: "string (required) - Your internal order ID",
      amount: "number (required) - Amount in paise (multiply INR by 100)",
      currency: "string (optional) - Currency code, default INR",
      description: "string (optional) - Payment description",
      customerEmail: "string (optional) - Customer email for notifications",
      customerPhone: "string (optional) - Customer phone",
      notes: "object (optional) - Additional notes for the order",
    },
    example: {
      orderId: "ORD-20250125-ABC123",
      amount: 50000, // ₹500
      currency: "INR",
      description: "Order payment for delivery",
      customerEmail: "customer@example.com",
      customerPhone: "+919876543210",
    },
  });
}
