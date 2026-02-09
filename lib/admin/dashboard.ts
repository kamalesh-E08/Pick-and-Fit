/**
 * Admin Dashboard Utilities
 * Helper functions for admin operations
 */

import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order";
import Product from "@/lib/db/models/Product";
import { Refund } from "@/lib/db/models/Refund";
import { Shipment } from "@/lib/db/models/Shipment";
import User from "@/lib/db/models/User";

/**
 * Get orders with pagination and filters
 */
export async function getOrders(
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = {};

  if (filters?.status) query.orderStatus = filters.status;
  if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters?.dateFrom || filters?.dateTo) {
    query.orderDate = {};
    if (filters?.dateFrom) query.orderDate.$gte = filters.dateFrom;
    if (filters?.dateTo) query.orderDate.$lte = filters.dateTo;
  }
  if (filters?.search) {
    query.$or = [
      { orderNumber: new RegExp(filters.search, "i") },
      { "shippingAddress.name": new RegExp(filters.search, "i") },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get seller orders (only orders containing seller products)
 */
export async function getSellerOrders(
  sellerId: string,
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  const sellerProducts = await Product.find({ sellerId }).select("_id");
  const productIds = sellerProducts.map((product) => product._id);

  if (productIds.length === 0) {
    return {
      orders: [],
      pagination: { total: 0, page, limit, pages: 0 },
    };
  }

  let query: any = { "items.productId": { $in: productIds } };

  if (filters?.status) query.orderStatus = filters.status;
  if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters?.dateFrom || filters?.dateTo) {
    query.orderDate = {};
    if (filters?.dateFrom) query.orderDate.$gte = filters.dateFrom;
    if (filters?.dateTo) query.orderDate.$lte = filters.dateTo;
  }
  if (filters?.search) {
    query.$or = [
      { orderNumber: new RegExp(filters.search, "i") },
      { "shippingAddress.name": new RegExp(filters.search, "i") },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  const productIdSet = new Set(productIds.map((id) => id.toString()));
  const sellerOrders = orders.map((order) => {
    const sellerItems = order.items.filter((item) =>
      productIdSet.has(item.productId.toString()),
    );
    const sellerTotal = sellerItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    return {
      ...order.toObject(),
      items: sellerItems,
      sellerTotal,
    };
  });

  return {
    orders: sellerOrders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get refunds with pagination and filters
 */
export async function getRefunds(
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.dateFrom || filters?.dateTo) {
    query.requestDate = {};
    if (filters?.dateFrom) query.requestDate.$gte = filters.dateFrom;
    if (filters?.dateTo) query.requestDate.$lte = filters.dateTo;
  }

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .populate("userId", "name email")
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit),
    Refund.countDocuments(query),
  ]);

  return {
    refunds,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get shipments with pagination and filters
 */
export async function getShipments(
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    carrier?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.carrier) query.carrier = filters.carrier;
  if (filters?.dateFrom || filters?.dateTo) {
    query.shippedDate = {};
    if (filters?.dateFrom) query.shippedDate.$gte = filters.dateFrom;
    if (filters?.dateTo) query.shippedDate.$lte = filters.dateTo;
  }

  const [shipments, total] = await Promise.all([
    Shipment.find(query).sort({ shippedDate: -1 }).skip(skip).limit(limit),
    Shipment.countDocuments(query),
  ]);

  return {
    shipments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get products with pagination and filters
 */
export async function getProducts(
  page = 1,
  limit = 10,
  filters?: {
    category?: string;
    gender?: string;
    search?: string;
    outOfStock?: boolean;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = {};

  if (filters?.category) query.category = filters.category;
  if (filters?.gender) query.gender = filters.gender;
  if (filters?.outOfStock) query.stock = { $lte: 0 };
  if (filters?.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { productId: new RegExp(filters.search, "i") },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get seller products only
 */
export async function getSellerProducts(
  sellerId: string,
  page = 1,
  limit = 10,
  filters?: {
    category?: string;
    gender?: string;
    search?: string;
    outOfStock?: boolean;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = { sellerId };

  if (filters?.category) query.category = filters.category;
  if (filters?.gender) query.gender = filters.gender;
  if (filters?.outOfStock) query.stock = { $lte: 0 };
  if (filters?.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { productId: new RegExp(filters.search, "i") },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get users with pagination and filters
 */
export async function getUsers(
  page = 1,
  limit = 10,
  filters?: {
    role?: string;
    verified?: boolean;
    search?: string;
  },
) {
  await connectDB();

  const skip = (page - 1) * limit;
  let query: any = {};

  if (filters?.role) query.role = filters.role;
  if (filters?.verified !== undefined) query.isVerified = filters.verified;
  if (filters?.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { email: new RegExp(filters.search, "i") },
      { phone: new RegExp(filters.search, "i") },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query, "-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics(dateRange = 30) {
  await connectDB();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - dateRange);

  const [orderStats, revenueStats, refundStats, topProducts, userStats] =
    await Promise.all([
      Order.aggregate([
        { $match: { orderDate: { $gte: fromDate } } },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: fromDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ]),
      Refund.aggregate([
        { $match: { requestDate: { $gte: fromDate } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { orderDate: { $gte: fromDate } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            count: { $sum: 1 },
            revenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: fromDate } } },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  return {
    orderStats,
    revenueStats: revenueStats[0],
    refundStats,
    topProducts,
    userStats,
    dateRange,
  };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  notes?: string,
) {
  await connectDB();

  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus: newStatus, internalNotes: notes },
    { new: true },
  );

  return order;
}

/**
 * Process refund
 */
export async function processRefund(
  refundId: string,
  action: "approve" | "reject",
  notes?: string,
  refundTransactionId?: string,
) {
  await connectDB();

  const refund = await Refund.findById(refundId);
  if (!refund) throw new Error("Refund not found");

  if (action === "approve") {
    refund.status = "processing";
    refund.approvedDate = new Date();
  } else {
    refund.status = "rejected";
    refund.rejectionReason = notes;
  }

  refund.internalNotes = notes;
  if (refundTransactionId) refund.refundTransactionId = refundTransactionId;

  await refund.save();
  return refund;
}

/**
 * Create shipment
 */
export async function createShipment(data: {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  cost: number;
  estimatedDelivery: Date;
}) {
  await connectDB();

  const shipment = await Shipment.create({
    ...data,
    shippedDate: new Date(),
    status: "pending",
    events: [
      {
        status: "pending",
        timestamp: new Date(),
        description: "Shipment created",
      },
    ],
  });

  return shipment;
}
