import { NextRequest, NextResponse } from "next/server";
import { withSellerAuth, logAdminAction } from "@/lib/auth/admin-middleware";
import { getSellerProducts } from "@/lib/admin/dashboard";
import { connectDB } from "@/lib/db/connection";
import { IProduct } from "@/lib/db/models/Product";

/**
 * GET /seller/api/products - Get seller products only
 * POST /seller/api/products - Create new product (seller-owned)
 * PUT /seller/api/products - Update seller product (seller-owned)
 * DELETE /seller/api/products - Delete seller product (seller-owned)
 */

function validateProductPayload(payload: any) {
  const errors: Record<string, string> = {};

  const requiredTextFields = [
    "productId",
    "name",
    "description",
    "category",
    "gender",
    "mainImage",
    "slug",
  ];

  for (const field of requiredTextFields) {
    if (!payload?.[field] || String(payload[field]).trim().length === 0) {
      errors[field] = `${field} is required`;
    }
  }

  const priceValue = Number(payload?.price);
  const originalPriceValue = Number(payload?.originalPrice ?? payload?.price);
  const stockValue = Number(payload?.stock);

  if (!payload?.price || Number.isNaN(priceValue) || priceValue <= 0) {
    errors.price = "price must be a positive number";
  }
  if (
    !payload?.originalPrice ||
    Number.isNaN(originalPriceValue) ||
    originalPriceValue < priceValue
  ) {
    errors.originalPrice =
      "originalPrice must be greater than or equal to price";
  }
  if (
    payload?.stock === undefined ||
    Number.isNaN(stockValue) ||
    stockValue < 0
  ) {
    errors.stock = "stock must be 0 or greater";
  }

  const arrayFields = ["images", "sizes", "colors"];
  for (const field of arrayFields) {
    const value = payload?.[field];
    if (!Array.isArray(value) || value.length === 0) {
      errors[field] = `${field} must have at least one value`;
    }
  }

  if (payload?.slug && !/^[a-z0-9-]+$/.test(payload.slug)) {
    errors.slug =
      "slug can only include lowercase letters, numbers, and hyphens";
  }

  return errors;
}

async function GET(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const category = searchParams.get("category") || undefined;

      const { products, pagination } = await getSellerProducts(
        request.user.id,
        page,
        limit,
        {
          search: search || undefined,
          category: category || undefined,
        },
      );

      return NextResponse.json({
        success: true,
        data: products,
        pagination,
      });
    } catch (error) {
      console.error("Error fetching seller products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

async function POST(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      const productData = await request.json();
      const validationErrors = validateProductPayload(productData);
      if (Object.keys(validationErrors).length > 0) {
        return NextResponse.json(
          { error: "Validation failed", fields: validationErrors },
          { status: 400 },
        );
      }

      await connectDB();

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
        sellerId: request.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await logAdminAction({
        adminEmail: request.user.email,
        adminId: request.user.id,
        action: "create",
        entityType: "product",
        entityId: newProduct._id.toString(),
        newValues: { ...productData, sellerId: request.user.id },
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
  return handler(req);
}

async function PUT(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      const { id, ...updates } = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: "Missing product id" },
          { status: 400 },
        );
      }

      const validationErrors = validateProductPayload(updates);
      if (Object.keys(validationErrors).length > 0) {
        return NextResponse.json(
          { error: "Validation failed", fields: validationErrors },
          { status: 400 },
        );
      }

      await connectDB();

      const allowedFields = [
        "name",
        "description",
        "shortDescription",
        "price",
        "originalPrice",
        "category",
        "subcategory",
        "gender",
        "brand",
        "images",
        "mainImage",
        "sizes",
        "colors",
        "tags",
        "material",
        "careInstructions",
        "features",
        "stock",
        "isAvailable",
        "sustainabilityScore",
        "certifications",
        "slug",
        "metaTitle",
        "metaDescription",
      ];

      const updatePayload: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) {
          updatePayload[key] = updates[key];
        }
      }

      updatePayload.updatedAt = new Date();

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id, sellerId: request.user.id },
        updatePayload,
        { new: true },
      );

      if (!updatedProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }

      await logAdminAction({
        adminEmail: request.user.email,
        adminId: request.user.id,
        action: "update",
        entityType: "product",
        entityId: updatedProduct._id.toString(),
        newValues: updatePayload,
      });

      return NextResponse.json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

async function DELETE(req: NextRequest) {
  const handler = await withSellerAuth(async (request: any) => {
    try {
      const { id } = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: "Missing product id" },
          { status: 400 },
        );
      }

      await connectDB();

      const deleted = await Product.findOneAndDelete({
        _id: id,
        sellerId: request.user.id,
      });

      if (!deleted) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }

      await logAdminAction({
        adminEmail: request.user.email,
        adminId: request.user.id,
        action: "delete",
        entityType: "product",
        entityId: id,
      });

      return NextResponse.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 },
      );
    }
  });
  return handler(req);
}

export { GET, POST, PUT, DELETE };
