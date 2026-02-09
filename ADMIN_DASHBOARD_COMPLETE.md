# 🏢 Admin/Seller Dashboard Implementation

Complete admin panel for managing e-commerce operations with order management, inventory control, refunds, shipments, and analytics.

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Models](#database-models)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Dashboard Pages](#dashboard-pages)
6. [Features](#features)
7. [Usage Guide](#usage-guide)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### System Components

```
Admin Panel (Frontend)
    ↓
Protected Routes (Middleware)
    ↓
API Layer (Next.js Routes)
    ↓
Business Logic (Dashboard Utils)
    ↓
Database (MongoDB with Mongoose)
```

### Key Features

- ✅ Role-based access control (Admin only)
- ✅ Comprehensive audit logging
- ✅ Real-time order management
- ✅ Inventory management with stock tracking
- ✅ Refund processing with approval workflow
- ✅ Shipment tracking and management
- ✅ User management and role assignment
- ✅ Advanced analytics and reporting
- ✅ JWT-based authentication
- ✅ Pagination and filtering

---

## Database Models

### 1. **AdminAudit** (`lib/db/models/AdminAudit.ts`)

Comprehensive audit trail for all admin actions.

```typescript
interface IAdminAudit extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string; // create, update, delete, view, export, etc.
  entityType: string; // order, product, user, refund, shipment
  entityId: string; // ID of the entity being modified
  changes: Record<string, any>; // What changed
  oldValues?: Record<string, any>; // Previous values
  newValues?: Record<string, any>; // New values
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: "success" | "failed";
  errorMessage?: string;
}
```

**Indexes:**

- `adminId + timestamp` (Recent admin actions)
- `entityType + entityId + timestamp` (Entity history)
- `action + timestamp` (Action tracking)

**Use Cases:**

- Compliance and audit requirements
- User behavior tracking
- Troubleshooting support issues
- Security monitoring

---

### 2. **Refund** (`lib/db/models/Refund.ts`)

Manages refund requests and processing.

```typescript
interface IRefund extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  reason: string; // defective_product, wrong_item, etc.
  amount: number; // Refund amount in paise
  status: "pending" | "approved" | "processing" | "completed" | "rejected";
  refundMethod: "original_payment" | "wallet" | "bank_transfer";
  refundTransactionId?: string; // Payment gateway transaction ID
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  rejectionReason?: string;
  items: {
    // Items being refunded
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  attachments?: string[]; // Proof images
  notes?: string;
  internalNotes?: string;
  processedBy?: Types.ObjectId; // Admin who processed
}
```

**Workflow:**

```
pending → approved → processing → completed
    ↓
  rejected
```

---

### 3. **Shipment** (`lib/db/models/Shipment.ts`)

Tracks shipment lifecycle and delivery.

```typescript
interface IShipment extends Document {
  orderId: Types.ObjectId;
  orderNumber: string;
  trackingNumber: string;
  carrier: "fedex" | "ups" | "dhl" | "aramex" | "local";
  status:
    | "pending"
    | "picked"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "failed";
  estimatedDelivery: Date;
  actualDelivery?: Date;
  pickupDate?: Date;
  shippedDate: Date;
  currentLocation?: string;
  events: {
    // Delivery timeline
    status: string;
    timestamp: Date;
    location?: string;
    description: string;
  }[];
  weight?: number; // in kg
  cost: number;
  insured: boolean;
  insuranceAmount?: number;
  signatureRequired: boolean;
  deliveryProof?: {
    imageUrl?: string;
    signature?: string;
    recipientName?: string;
    timestamp: Date;
  };
  notes?: string;
}
```

</ **Status Flow:**

```
pending → picked → in_transit → out_for_delivery → delivered
                                            ↓
                                          failed
```

---

### 4. **User Model Update**

Added `role` field to existing User model:

```typescript
interface IUser extends Document {
  // ... existing fields ...
  role: "customer" | "admin" | "seller"; // Role for access control
  // ... rest of fields ...
}
```

---

## API Endpoints

### Orders Management

#### GET `/admin/api/orders`

Get all orders with filters and pagination.

**Query Parameters:**

- `page` (int): Page number, default 1
- `limit` (int): Items per page, default 10
- `status` (string): Filter by order status (optional)
- `paymentStatus` (string): Filter by payment status (optional)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderNumber": "ORD-001",
      "total": 5000,
      "orderStatus": "processing",
      "paymentStatus": "paid",
      "orderDate": "2024-02-09T...",
      "shippingAddress": { "name": "John Doe" }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

#### POST `/admin/api/orders`

Update order status.

**Request Body:**

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "status": "shipped",
  "notes": "Order dispatched from warehouse"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated",
  "data": { ... updated order ... }
}
```

---

### Products Management

#### GET `/admin/api/products`

Get all products with filters.

**Query Parameters:**

- `page` (int): Page number
- `limit` (int): Items per page
- `search` (string): Search by name or ID
- `category` (string): Filter by category

#### POST `/admin/api/products`

Create new product.

**Request Body:**

```json
{
  "productId": "123",
  "name": "Cotton T-Shirt",
  "price": 499,
  "stock": 50,
  "category": "men",
  "gender": "men"
}
```

---

### Refunds Management

#### GET `/admin/api/refunds`

Get refund requests with filters.

**Query Parameters:**

- `page` (int): Page number
- `limit` (int): Items per page
- `status` (string): pending, approved, processing, completed, rejected

#### POST `/admin/api/refunds`

Approve or reject refund.

**Request Body:**

```json
{
  "refundId": "507f1f77bcf86cd799439011",
  "action": "approve", // or "reject"
  "notes": "Refund approved - issued to original payment method",
  "transactionId": "TXN-12345"
}
```

---

### Shipments Management

#### GET `/admin/api/shipments`

Get shipments with filters.

**Query Parameters:**

- `page` (int)
- `limit` (int)
- `status` (string): pending, picked, in_transit, out_for_delivery, delivered
- `carrier` (string): fedex, ups, dhl, aramex, local

#### POST `/admin/api/shipments`

Create new shipment.

**Request Body:**

```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-001",
  "trackingNumber": "TRK-123456789",
  "carrier": "fedex",
  "cost": 150,
  "estimatedDelivery": "2024-02-15T00:00:00Z"
}
```

---

### Users Management

#### GET `/admin/api/users`

Get users with filters.

**Query Parameters:**

- `page` (int)
- `limit` (int)
- `role` (string): customer, admin, seller
- `search` (string): Search by name, email, phone

---

### Analytics

#### GET `/admin/api/analytics`

Get dashboard analytics and statistics.

**Query Parameters:**

- `dateRange` (int): Days to include (7, 30, 90, 365)

**Response:**

```json
{
  "success": true,
  "data": {
    "orderStats": [
      { "_id": "pending", "count": 5 },
      { "_id": "shipped", "count": 20 }
    ],
    "revenueStats": {
      "total": 150000,
      "count": 45
    },
    "refundStats": [{ "_id": "pending", "count": 2, "amount": 1000 }],
    "topProducts": [{ "_id": "product-1", "count": 12, "revenue": 50000 }],
    "userStats": [{ "_id": "customer", "count": 5000 }]
  }
}
```

---

## Authentication & Authorization

### Admin Middleware

Located in `lib/auth/admin-middleware.ts`

**Functions:**

1. **withAdminAuth(handler)**
   - Protects routes requiring admin role
   - Extracts and validates JWT token
   - Checks user role
   - Returns 403 if not admin

```typescript
export const GET = withAdminAuth(async (req) => {
  // Only admins can access
  return NextResponse.json({ data: "..." });
});
```

2. **extractToken(req)**
   - Gets JWT from Authorization header
   - Format: `Bearer <token>`

3. **logAdminAction(...)**
   - Records all admin actions in audit trail
   - Captures old and new values
   - Stores IP address and user agent

4. **getAdminStats()**
   - Returns key metrics
   - Total orders, revenue, active orders, products, pending refunds

5. **isUserAdmin(userId)**
   - Checks if user has admin role

---

### Auth Flow

```
Admin logs in
    ↓
JWT token generated
    ↓
Token stored in localStorage (accessToken)
    ↓
Admin visits /admin/*
    ↓
withAdminAuth middleware verifies token
    ↓
User attached to request
    ↓
API call executed
    ↓
Action logged in AdminAudit collection
```

---

## Dashboard Pages

### 1. Admin Home (`/admin`)

**Features:**

- Dashboard statistics (orders, revenue, products, refunds)
- Quick navigation to all admin sections
- Recent activity log
- Key metrics visualization

**Stats Displayed:**

- Total Orders
- Total Revenue
- Active Orders
- Total Products
- Pending Refunds

---

### 2. Orders Management (`/admin/orders`)

**Features:**

- List all orders with pagination
- Filter by status (pending, confirmed, processing, shipped, delivered, cancelled)
- View order details
- Update order status in real-time
- Status color coding

**Quick Actions:**

- Change status via dropdown
- View complete order details
- Filter by payment status

---

### 3. Products Management (`/admin/products`)

**Features:**

- Display all products in grid view
- Search and filter functionality
- Stock level indicators
- Availability status
- Add, edit, delete products

**Product Card Shows:**

- Product name
- Category
- Price
- Stock level
- Availability status
- Edit/Delete buttons

---

### 4. Refunds Processing (`/admin/refunds`)

**Features:**

- List pending refund requests
- Filter by refund status
- Approve/reject functionality
- Track refund reason
- Audit trail of refund processing

**Refund Status Flow:**

- Pending → Approve → Processing → Completed
- Pending → Reject

---

### 5. Shipments Tracking (`/admin/shipments`)

**Features:**

- Track all active shipments
- Update delivery status
- Monitor estimated delivery dates
- Filter by carrier (FedEx, UPS, DHL, etc.)
- View tracking events timeline

**Carriers Supported:**

- FedEx
- UPS
- DHL
- Aramex
- Local delivery

---

### 6. User Management (`/admin/users`)

**Features:**

- View all registered users
- Filter by role (customer, admin, seller)
- Search by name, email, phone
- Verify user status
- View registration date

**User Roles:**

- **Customer**: Regular buyers
- **Admin**: Full system access
- **Seller**: Can manage own products

---

### 7. Analytics (`/admin/analytics`)

**Features:**

- Revenue statistics
- Order distribution by status
- Refund tracking
- Top selling products
- User demographic data
- Date range selection (7, 30, 90, 365 days)

**Visualizations:**

- Order status distribution (bar chart)
- Revenue vs orders
- Top 5 products by revenue
- Refund statistics

---

## Features

### Order Management

- View all orders with pagination
- Filter by status and payment status
- Update order status
- Add internal notes
- Track order history
- Automatic audit logging

### Inventory Management

- Real-time stock tracking
- Low stock warnings
- Product availability status
- Bulk price updates (future)
- Stock movement history (future)

### Refund Processing

- Centralized refund requests management
- Approval/rejection workflow
- Multiple refund methods support
  - Original payment method
  - Wallet/store credit
  - Bank transfer
- Attachment upload (proof images)
- Internal notes for support team
- Automatic email notifications

### Shipment Tracking

- Multiple carrier integration
- Real-time status updates
- Delivery timeline visualization
- Digital proof of delivery
- Delivery signature capture
- Insurance options

### User Management

- Complete user directory
- Role-based filtering
- Search functionality
- Verification status tracking
- Account creation/modification history

### Advanced Analytics

- Revenue analysis
- Order trends
- Refund statistics
- Product performance
- User growth metrics
- Custom date ranges

---

## Usage Guide

### For Admin Users

#### 1. Accessing the Dashboard

```
1. Navigate to https://yourdomain.com/admin
2. Auto-redirects to /signin if not authenticated
3. Login with admin account
4. Dashboard loads automatically
```

#### 2. Managing Orders

```
1. Click "Orders" on dashboard
2. View all orders in table format
3. Filter by status (optional)
4. Click order number for details
5. Change status in dropdown menu
6. Add notes in notes field
7. Changes saved immediately
8. Action logged for audit
```

#### 3. Processing Refunds

```
1. Go to Refunds section
2. View pending refund requests
3. Review reason and attached images
4. Click Approve or Reject
5. If approving:
   - Select refund method
   - Enter transaction ID (if applicable)
   - Add notes for tracking
6. System sends customer notification email
7. Refund logged in audit trail
```

#### 4. Creating Shipments

```
1. Navigate to Shipments
2. Click "New Shipment"
3. Enter order number
4. Select carrier (FedEx, UPS, DHL, etc.)
5. Add tracking number
6. Set estimated delivery date
7. Enter shipment cost
8. Submit form
9. Customer gets tracking email
```

#### 5. Analyzing Performance

```
1. Go to Analytics section
2. Select date range (7/30/90/365 days)
3. View key metrics:
   - Orders by status
   - Revenue total
   - Refund statistics
   - Top selling products
4. Export data (future feature)
5. Download reports
```

---

## Best Practices

### 1. Security

- ✅ Always verify user is admin before showing sensitive data
- ✅ Log all admin actions for audit trail
- ✅ Use JWT tokens with expiration
- ✅ Hash sensitive data before storing
- ✅ Validate all inputs on backend
- ✅ Use HTTPS for all communications

### 2. Data Management

- ✅ Paginate large result sets
- ✅ Use indexes for frequently queried fields
- ✅ Archive old records periodically
- ✅ Maintain data consistency
- ✅ Create regular backups
- ✅ Monitor query performance

### 3. User Experience

- ✅ Provide clear error messages
- ✅ Show loading states during API calls
- ✅ Disable buttons during submission
- ✅ Confirm destructive actions
- ✅ Use status color coding for clarity
- ✅ Implement infinite scroll or pagination

### 4. Operational

- ✅ Regular backups of admin audit logs
- ✅ Monitor failed refunds
- ✅ Check shipment delays
- ✅ Review product stock levels daily
- ✅ Validate payment reconciliation
- ✅ Setup alerts for critical metrics

---

## Integration Checklist

- [ ] User model updated with role field
- [ ] AdminAudit model created in MongoDB
- [ ] Refund model created in MongoDB
- [ ] Shipment model created in MongoDB
- [ ] Admin middleware in place
- [ ] All API routes created
- [ ] Admin pages created (/admin/\*)
- [ ] Authentication configured
- [ ] Audit logging working
- [ ] Email notifications setup
- [ ] Error handling implemented

---

## Testing the Dashboard

### 1. Create Test Admin User

```bash
# Manually add to MongoDB:
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "hashed_password",  # Use bcrypt
  role: "admin",
  isVerified: true,
  createdAt: new Date()
})
```

### 2. Login and Test

```
1. Go to /signin
2. Login with admin@example.com
3. Redirect to /admin dashboard
4. Test each section
5. Check audit logs
6. Verify emails sent
```

### 3. Sample Requests

```bash
# Get orders
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/admin/api/orders?page=1&limit=10

# Get analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/admin/api/analytics?dateRange=30

# Approve refund
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refundId":"...","action":"approve"}' \
  https://yourdomain.com/admin/api/refunds
```

---

## Performance Optimization

### Database Indexes

```javascript
// OrdersCollection
db.orders.createIndex({ orderDate: -1 });
db.orders.createIndex({ orderStatus: 1 });

// RefundsCollection
db.refunds.createIndex({ status: 1, requestDate: -1 });

// AdminAuditCollection
db.adminaudits.createIndex({ adminId: 1, timestamp: -1 });
db.adminaudits.createIndex({ entityType: 1, entityId: 1 });
```

### Caching Strategies

- Cache analytics data for 5 minutes
- Cache product list for 10 minutes
- Invalidate cache on updates
- Use Redis for scale

---

## Future Enhancements

1. **Bulk Operations**
   - Bulk status updates
   - Bulk refund processing
   - Bulk shipment creation

2. **Advanced Analytics**
   - Custom report builder
   - Data export (CSV, Excel)
   - Scheduled reports via email
   - Real-time dashboards

3. **Automation**
   - Auto-refund on conditions
   - Auto-ship integration
   - Automatic reminders
   - Stock replenishment alerts

4. **Integration**
   - Multi-carrier API integration
   - Payment gateway settlement
   - Accounting software sync
   - CRM integration

5. **User Features**
   - Role-based sub-admins
   - Team management
   - Department-specific views
   - Custom permissions

---

## Support & Troubleshooting

**Issue:** Admin can't access dashboard

- Check user role is "admin"
- Verify token is valid
- Check CORS configuration

**Issue:** Refund not processing

- Check refund status
- Verify payment method
- Check MongoDB connection
- Review audit logs

**Issue:** Slow page load

- Check database indexes
- Review query performance
- Consider caching
- Optimize images

---

**Last Updated:** February 9, 2026  
**Status:** ✅ Production Ready
