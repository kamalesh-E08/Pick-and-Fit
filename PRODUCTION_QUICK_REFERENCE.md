# Production Features Quick Reference

## 🎯 Key Components

### JWT Token Management

```typescript
import {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
} from "@/lib/auth/jwt";

// Generate tokens on login
const { accessToken, refreshToken } = generateTokenPair({
  id: user._id,
  email: user.email,
  name: user.name,
  role: "user",
});

// Verify token
const payload = verifyAccessToken(token);
if (payload) {
  console.log(payload.id); // User ID from token
}

// Refresh on expiry
const newAccessToken = refreshAccessToken(refreshToken);
```

### API Route Protection

```typescript
import { withAuth, withRole } from "@/lib/auth/middleware";

// Require authentication
export const POST = withAuth(async (req) => {
  const user = req.user; // Attached by middleware
  return NextResponse.json({ authenticated: true });
});

// Require specific role
export const DELETE = withRole("admin")(async (req) => {
  // Only admins can access this
  return NextResponse.json({ message: "Deleted" });
});
```

### Razorpay Payment Orders

```typescript
// Create order
const response = await fetch("/api/razorpay/create-order", {
  method: "POST",
  body: JSON.stringify({
    orderId: "ORD-123",
    amount: 50000, // in paise
    currency: "INR",
    customerEmail: "user@example.com",
  }),
});

const { orderId, key } = await response.json();

// Use orderId to initialize Razorpay checkout
```

### Email Notifications

```typescript
import {
  sendOrderConfirmationEmail,
  sendPaymentReceiptEmail,
  sendShippingEmail,
  sendDeliveryEmail,
} from "@/lib/services/email";

// Send order confirmation
await sendOrderConfirmationEmail(orderId, customerEmail);

// Send payment receipt
await sendPaymentReceiptEmail(orderId, customerEmail, paymentId);

// Send shipping notification
await sendShippingEmail(orderId, customerEmail, trackingNumber);
```

### Rate Limiting

```typescript
import { withRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

// Apply global rate limit
export const POST = withRateLimit(
  RATE_LIMITS.payment.requests,
  RATE_LIMITS.payment.window,
)(async (req) => {
  // Handler code
});

// Response headers will include:
// X-RateLimit-Limit: 3
// X-RateLimit-Remaining: 2
// X-RateLimit-Reset: 1644321600
```

## 📡 API Endpoints

### Razorpay Create Order

```
POST /api/razorpay/create-order
Content-Type: application/json

{
  "orderId": "ORD-20250209-ABC123",
  "amount": 50000,
  "currency": "INR",
  "description": "Order payment",
  "customerEmail": "user@example.com",
  "customerPhone": "+919876543210"
}

Response:
{
  "success": true,
  "orderId": "order_XXXXXXXXX",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_live_xxxxx"
}
```

### Process Payment

```
POST /api/process-payment
Content-Type: application/json

{
  "orderId": "ORD-20250209-ABC123",
  "razorpayPaymentId": "pay_XXXXXXXXX",
  "razorpayOrderId": "order_XXXXXXXXX",
  "razorpaySignature": "signature_hash",
  "amount": 500,
  "userEmail": "user@example.com"
}

Response:
{
  "success": true,
  "orderId": "order_id",
  "paymentId": "pay_XXXXXXXXX",
  "paymentStatus": "completed",
  "orderStatus": "confirmed"
}
```

## 🔐 Environment Variables

### Required

```bash
# JWT
JWT_SECRET=long-random-string-min-32-chars
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=long-random-string-min-32-chars

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## 🧪 Testing Examples

### Test Razorpay Payment

```bash
curl -X POST http://localhost:3000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 50000,
    "currency": "INR"
  }'
```

### Test JWT Authentication

```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}' \
  | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/protected-route
```

## 📊 Rate Limits by Endpoint

| Endpoint            | Limit | Window     |
| ------------------- | ----- | ---------- |
| Auth (login/signup) | 5     | 15 minutes |
| Payment processing  | 3     | 1 hour     |
| Default API         | 100   | 1 minute   |
| Search              | 300   | 1 minute   |
| Public              | 1000  | 1 minute   |

## ⚠️ Common Mistakes

❌ **Wrong**: Storing Razorpay keys in frontend  
✅ **Right**: Use `.env.local` backend only

❌ **Wrong**: Skipping webhook signature verification  
✅ **Right**: Always verify HMAC-SHA256 signature

❌ **Wrong**: Trusting client-side amount validation  
✅ **Right**: Always verify server-side against order

## 📞 Documentation Links

- [Full Implementation Guide](./PRODUCTION_FEATURES_IMPLEMENTATION.md)
- [Setup Instructions](./SETUP_GUIDE.md)
- [Razorpay Docs](https://razorpay.com/docs/)
- [SendGrid Docs](https://sendgrid.com/docs/)
