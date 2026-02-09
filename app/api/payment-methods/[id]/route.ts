import { connect } from "@/lib/db/connection";
import PaymentMethod from "@/lib/db/models/PaymentMethod";
import { NextRequest, NextResponse } from "next/server";

// GET /api/payment-methods/[id] - Get specific payment method
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const paymentMethod = await PaymentMethod.findById(params.id).lean();

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ paymentMethod }, { status: 200 });
  } catch (error) {
    console.error("Get payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/payment-methods/[id] - Delete payment method
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const paymentMethod = await PaymentMethod.findByIdAndDelete(params.id);

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    // If it was the default, set the first remaining method as default
    if (paymentMethod.isDefault) {
      const nextDefault = await PaymentMethod.findOne({
        userEmail: paymentMethod.userEmail,
      });
      if (nextDefault) {
        await PaymentMethod.findByIdAndUpdate(nextDefault._id, {
          isDefault: true,
        });
      }
    }

    return NextResponse.json(
      { message: "Payment method deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete payment method error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
