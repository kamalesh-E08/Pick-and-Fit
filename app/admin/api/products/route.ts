import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, logAdminAction } from "@/lib/auth/admin-middleware";
import { getProducts } from "@/lib/admin/dashboard";
import { csvResponse, toCsv } from "@/lib/admin/csv";
import { connectDB } from "@/lib/db/connection";
import { IProduct } from "@/lib/db/models/Product";
import Product from "@/lib/db/models/Product";

/**
 * GET /admin/api/products - Get all products
 * POST /admin/api/products - Create new product
 */

const GET = withAdminAuth(async (request: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;

    const isExport = searchParams.get("export") === "csv";
    const { products, pagination } = await getProducts(
      isExport ? 1 : page,
      isExport ? 10000 : limit,
      {
        search: search || undefined,
        category: category || undefined,
      },
    );

    if (isExport) {
      const rows = products.map((product: any) => ({
        productId: product.productId,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        isAvailable: product.isAvailable,
        sellerId: product.sellerId || "",
      }));
      const csv = toCsv(rows, [
        "productId",
        "name",
        "category",
        "price",
        "stock",
        "isAvailable",
        "sellerId",
      ]);
      return csvResponse("products.csv", csv);
    }

    return NextResponse.json({
      success: true,
      data: products,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
});

const POST = withAdminAuth(async (request: any) => {
  try {
    const productData = await request.json();

    await connectDB();

    // Check if product ID already exists
    const existingProduct = await Product.findOne({
      productId: productData.productId,
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this ID already exists" },
        { status: 409 },
      );
    }

    const newProduct = await Product.create({
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log the action
    await logAdminAction({
      adminEmail: request.user.email,
      adminId: request.user.id,
      action: "create",
      entityType: "product",
      entityId: newProduct._id.toString(),
      newValues: productData,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: newProduct,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
});

export { GET, POST };
