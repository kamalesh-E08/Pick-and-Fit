# Production Features Setup Guide

This guide will walk you through configuring the newly implemented production features for your Pick and Fit e-commerce platform.

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ Node.js v22 installed
- ✅ MongoDB connection string (from Atlas)
- ✅ npm packages installed (`npm install` completed)
- ✅ Development server working

## 🔑 Step 1: Razorpay Configuration

### 1.1 Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up for an account
3. Complete KYC verification
4. Go to Dashboard → Settings → API Keys

### 1.2 Get API Credentials

1. Copy your **Key ID** (starts with `rzp_live_` or `rzp_test_`)
2. Copy your **Key Secret**
3. Update `.env.local`:
   ```bash
   RAZORPAY_KEY_ID=YOUR_KEY_ID_HERE
   RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
   NEXT_PUBLIC_RAZORPAY_KEY_ID=YOUR_KEY_ID_HERE
   ```

### 1.3 Configure Webhook

1. In Razorpay Dashboard → Settings → Webhooks
2. Click "Add New Webhook"
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/webhooks/razorpay
   ```
   (For development use ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/razorpay`)
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
   - `refund.failed`
5. Copy the **Webhook Secret** and update `.env.local`:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
   ```
6. Click "Create"

### 1.4 Test Credentials (Optional - for development)

For testing without real payments, you can use Razorpay's test credentials:

- **Test Key ID**: Start with `rzp_test_`
- **Test Card**: 4111 1111 1111 1111 (any future MM/YY and CVV)

## 📧 Step 2: SendGrid Configuration

### 2.1 Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account
3. Go to Settings → API Keys

### 2.2 Generate API Key

1. Click "Create API Key"
2. Name it (e.g., "Pick and Fit Production")
3. Select "Full Access" permissions
4. Click "Create & Save"
5. Copy the API key (starts with `SG.`)
6. Update `.env.local`:
   ```bash
   SENDGRID_API_KEY=SG.YOUR_API_KEY_HERE
   ```

### 2.3 Configure Sender Email

1. Go to Settings → Sender Authentication
2. Choose "Single Sender Verification"
3. Enter your email (e.g., noreply@yourdomain.com)
4. Verify the email
5. Update `.env.local`:
   ```bash
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Pick and Fit
   ```

### 2.4 Create Email Templates (Optional)

1. Go to Dynamic Templates
2. Click "Create a Dynamic Template"
3. Create templates for:
   - Order Confirmation
   - Payment Receipt
   - Shipping Notification
   - Delivery Confirmation
   - Refund Notice
4. Copy template IDs and update `.env.local`:
   ```bash
   EMAIL_TEMPLATE_ORDER_CONFIRMATION=d-xxxxx
   EMAIL_TEMPLATE_PAYMENT_RECEIPT=d-xxxxx
   EMAIL_TEMPLATE_SHIPPING=d-xxxxx
   EMAIL_TEMPLATE_DELIVERY=d-xxxxx
   EMAIL_TEMPLATE_REFUND=d-xxxxx
   EMAIL_TEMPLATE_ORDER_CANCELLED=d-xxxxx
   EMAIL_TEMPLATE_RESET_PASSWORD=d-xxxxx
   ```

## 🔐 Step 3: JWT Configuration

### 3.1 Generate JWT Secrets

Use a strong random string generator. For security, generate two secrets:

```bash
# Generate secure random strings (min 32 characters)
# Using Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=your_generated_secret_here_min_32_chars
REFRESH_TOKEN_SECRET=your_generated_secret_here_min_32_chars
```

### 3.2 Update Environment Variables

```bash
JWT_SECRET=YOUR_32_CHAR_SECRET_HERE
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=YOUR_32_CHAR_SECRET_HERE
REFRESH_TOKEN_EXPIRE=30d
```

### 3.3 Secure Storage

- ✅ Never commit `.env.local` to git
- ✅ Store secrets in your deployment platform's secrets manager
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/production

## 🛡️ Step 4: Security Configuration

### 4.1 Rate Limiting

```bash
RATE_LIMIT_REQUESTS=100        # Requests per window
RATE_LIMIT_WINDOW=60000         # Time window in ms (1 minute)
```

### 4.2 CORS Configuration

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 4.3 Webhook Protection

```bash
WEBHOOK_VERIFY_TOKEN=your_webhook_secret_token
```

## 🧪 Step 5: Testing the Setup

### 5.1 Test Razorpay Integration

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/checkout`
3. Add items to cart
4. Click "Continue to Payment"
5. Try creating an order:
   ```bash
   curl -X POST http://localhost:3000/api/razorpay/create-order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "TEST-001",
       "amount": 50000,
       "currency": "INR"
     }'
   ```

### 5.2 Test Email Service

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com",
    "type": "order_confirmation"
  }'
```

### 5.3 Test Rate Limiting

```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl http://localhost:3000/api/process-payment
  echo "Request $i"
done

# Should see 429 status after rate limit exceeded
```

### 5.4 Test JWT Authentication

```bash
# Generate token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Use token in protected route
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/protected-endpoint
```

## 🚀 Step 6: Deployment Configuration

### 6.1 Production Environment Variables

Create a `.env.production` file with:

```bash
# Database
MONGODB_URI=your_production_mongodb_uri

# JWT
JWT_SECRET=your_production_jwt_secret
REFRESH_TOKEN_SECRET=your_production_refresh_secret

# Razorpay (Production Keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=your_production_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxx

# SendGrid
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 6.2 Vercel/Netlify Deploy

1. Add environment variables to your platform
2. Deploy: `git push origin main`
3. Monitor logs for any issues

### 6.3 Self-Hosted Deploy

1. SSH into your server
2. Clone your repository
3. Install dependencies: `npm install`
4. Create `.env.local` with production values
5. Build: `npm run build`
6. Start: `npm start`

## 🔍 Troubleshooting

### Issue: "API key does not start with 'SG.'"

**Solution**: You're using an invalid SendGrid API key. Make sure it starts with `SG.` and is generated from the Settings → API Keys page.

### Issue: "401 Invalid or expired token"

**Solution**: Your JWT secret doesn't match. Ensure `JWT_SECRET` is the same in all environments.

### Issue: Webhooks not being received

**Solution**:

1. Check your domain is accessible from the internet
2. Use ngrok for localhost testing: `ngrok http 3000`
3. Verify webhook URL in Razorpay dashboard
4. Check server logs for incoming webhooks

### Issue: Emails not sending

**Solution**:

1. Verify SendGrid API key is correct
2. Check sender email is verified in SendGrid
3. Check spam folder
4. View SendGrid Activity dashboard

### Issue: Rate limit not working

**Solution**: Rate limiting uses in-memory store. For production, implement Redis:

```typescript
// In lib/middleware/rate-limit.ts, replace rateLimitStore with Redis client
```

## 📞 Support

### Common Tasks

**View all orders**:

```bash
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check order status**:

```bash
curl http://localhost:3000/api/track-order?orderId=ORD-20250209-ABC123
```

**View payment details**:

```bash
curl http://localhost:3000/api/process-payment \
  -H "Content-Type: application/json"
```

**Manual payment verification**:

```bash
curl -X POST http://localhost:3000/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-20250209-ABC123",
    "razorpayPaymentId": "pay_xxxxx",
    "razorpayOrderId": "order_xxxxx",
    "razorpaySignature": "sig_xxxxx",
    "amount": 500,
    "userEmail": "user@example.com"
  }'
```

## ✅ Final Checklist

Before going live, verify:

- [ ] Razorpay live credentials configured
- [ ] SendGrid API key working
- [ ] Webhooks receiving events
- [ ] Emails sending successfully
- [ ] JWT tokens generating/validating
- [ ] Rate limiting working
- [ ] MongoDB transactions enabled (required for webhook handlers)
- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] All tests passing (if implemented)
- [ ] Monitoring/logging configured
- [ ] SSL certificate valid
- [ ] CORS configured correctly

## 📚 Additional Resources

- [Razorpay Integration Guide](https://razorpay.com/docs/api/orders/)
- [SendGrid Email API](https://sendgrid.com/docs/api-reference/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [MongoDB Transactions](https://docs.mongodb.com/manual/transactions/)

---

**Need help?** Check the [PRODUCTION_FEATURES_IMPLEMENTATION.md](PRODUCTION_FEATURES_IMPLEMENTATION.md) for detailed documentation.
