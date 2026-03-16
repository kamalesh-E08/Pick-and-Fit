import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Product from "@/lib/db/models/Product";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const gender = searchParams.get("gender") || undefined;
    const category = searchParams.get("category") || undefined;
    const subcategory = searchParams.get("subcategory") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      100,
      parseInt(searchParams.get("limit") || "60", 10),
    );

    const query: Record<string, any> = {
      isAvailable: true,
      stock: { $gt: 0 },
    };

    if (gender) query.gender = gender;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
