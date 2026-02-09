import { connect } from "@/lib/db/connection";
import PaymentMethod from "@/lib/db/models/PaymentMethod";
import { NextRequest, NextResponse } from "next/server";

// GET /api/payment-methods - List user's payment methods
export async function GET(req: NextRequest) {
  try {
    await connect();

    const userEmail = req.nextUrl.searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 },
      );
    }

    const paymentMethods = await PaymentMethod.find({ userEmail })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    // Remove sensitive data before sending
    const safeMethods = paymentMethods.map((method) => ({
      ...method,
      cardDetails: method.cardDetails
        ? {
            lastFour: method.cardDetails.lastFour,
            brand: method.cardDetails.brand,
            expiryMonth: method.cardDetails.expiryMonth,
            expiryYear: method.cardDetails.expiryYear,
            // Don't send full name for security
          }
        : null,
      paypalDetails: method.paypalDetails
        ? { email: method.paypalDetails.email }
        : null,
    }));

    return NextResponse.json({ paymentMethods: safeMethods }, { status: 200 });
  } catch (error) {
    console.error("Get payment methods error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/payment-methods - Add new payment method
export async function POST(req: NextRequest) {
  try {
    await connect();

    const { userId, userEmail, type, cardDetails, paypalDetails, isDefault } =
      await req.json();

    // Validation
    if (!userEmail || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 },
      );
    }

    const validTypes = [
      "credit_card",
      "debit_card",
      "paypal",
      "apple_pay",
      "google_pay",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 },
      );
    }

    // If type is credit_card or debit_card, validate card details
    if ((type === "credit_card" || type === "debit_card") && !cardDetails) {
      return NextResponse.json(
        { error: "Card details required for card payments" },
        { status: 400 },
      );
    }

    // If setting as default, remove default from other methods
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userEmail, _id: { $ne: null } },
        { isDefault: false },
      );
    }

    const paymentMethod = new PaymentMethod({
      userId,
      userEmail,
      type,
      cardDetails:
        type === "credit_card" || type === "debit_card" ? cardDetails : null,
      paypalDetails: type === "paypal" ? paypalDetails : null,
      isDefault: isDefault || false,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await paymentMethod.save();

    return NextResponse.json(
      {
        message: "Payment method added",
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          isDefault: paymentMethod.isDefault,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/payment-methods - Update payment method
export async function PUT(req: NextRequest) {
  try {
    await connect();

    const { paymentMethodId, isDefault } = await req.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID required" },
        { status: 400 },
      );
    }

    // Get the payment method first
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    // If setting as default, remove default from other methods
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userEmail: paymentMethod.userEmail, _id: { $ne: paymentMethodId } },
        { isDefault: false },
      );
    }

    const updated = await PaymentMethod.findByIdAndUpdate(
      paymentMethodId,
      {
        isDefault: isDefault ?? paymentMethod.isDefault,
        updatedAt: new Date(),
      },
      { new: true },
    );

    return NextResponse.json(
      { message: "Payment method updated", paymentMethod: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
