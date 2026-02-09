# Payment & Order Tracking System

A comprehensive payment processing and order tracking system for the Pick & Fit e-commerce platform.

## Features

### Payment Page (`/payment`)

- **Multiple Payment Methods**:
  - Credit/Debit Card
  - UPI (Unified Payments Interface)
  - Net Banking
- **Saved Payment Methods**: Users can save and reuse payment methods
- **Real-time Validation**: Card number, CVV, expiry date, and UPI ID validation
- **Order Summary**: Clear pricing breakdown with subtotal, shipping, and tax
- **Secure Processing**: Payment data handling with proper encryption
- **Transaction Confirmation**: Unique transaction IDs for each payment

### Order Tracking Page (`/track-order`)

- **Order Search**: Search by Order ID or Tracking Number
- **Real-time Status Updates**: Live order status tracking
- **Timeline Visualization**: Visual timeline showing order progression
- **Delivery Stages**:
  - Pending
  - Confirmed
  - Processing
  - Shipped
  - Delivered

- **Shipping Address**: Display delivery address
- **Order Items**: List of items in the order
- **Estimated Delivery**: Delivery date estimation
- **Support Links**: Quick access to customer support

## File Structure

```
app/
├── payment/
│   └── page.tsx                 # Payment processing page
├── track-order/
│   └── page.tsx                 # Order tracking page
└── api/
    ├── process-payment/
    │   └── route.ts             # Payment API endpoint
    └── track-order/
        └── route.ts             # Tracking API endpoint

components/
├── order-tracking-timeline.tsx  # Timeline component
├── payment-button.tsx           # Payment button component
```

## Database Schema Updates

### Order Model - New Fields

```typescript
interface ITrackingEvent {
  status: string;
  timestamp: Date;
  location?: string;
  description: string;
}

// Added to IOrder:
trackingEvents?: ITrackingEvent[];
```

## API Endpoints

### Process Payment

**POST** `/api/process-payment`

**Request Body**:

```json
{
  "orderId": "order_id",
  "amount": 1999,
  "paymentType": "card|upi|netbanking",
  "paymentMethod": "id_or_type",
  "cardDetails": {
    "cardNumber": "1234567890123456",
    "cardHolder": "John Doe",
    "expiryDate": "12/25",
    "cvv": "123"
  },
  "upiId": "user@bank",
  "userEmail": "user@example.com"
}
```

**Response**:

```json
{
  "message": "Payment processed successfully",
  "transactionId": "TXN-1707XXX-XXXXX",
  "orderId": "order_id"
}
```

### Track Order

**GET** `/api/track-order?orderId=order_id`

**Response**:

```json
{
  "tracking": {
    "orderNumber": "ORD-20240209-123456",
    "trackingNumber": "TRACK-XXXXX",
    "currentStatus": "shipped",
    "events": [
      {
        "status": "pending",
        "timestamp": "2024-02-09T10:00:00Z",
        "location": "Order Center",
        "description": "Your order has been received"
      }
    ],
    "estimatedDelivery": "2024-02-16T10:00:00Z",
    "lastUpdate": "2024-02-12T15:30:00Z"
  }
}
```

## Integration with Checkout

### From Checkout Page

Users can proceed to payment in two ways:

1. **Using Payment Button Component**:

```tsx
import PaymentButton from "@/components/payment-button";

export default function CheckoutPage() {
  return <PaymentButton />;
}
```

2. **Direct Navigation**:

```typescript
router.push(`/payment?orderId=${orderId}&amount=${total}`);
```

### Order Data Storage

Payment page retrieves order data from:

1. localStorage (key: `pendingOrder`)
2. Query parameters (`?orderId=xxx&amount=xxx`)

## Supported Payment Methods

### Card Payment

- Validates 16-digit card number
- Checks expiry date (MM/YY format)
- Validates 3-digit CVV
- Supports major card brands

### UPI

- Validates UPI ID format (username@bank)
- Supports all Indian UPI providers
- Real-time verification possible

### Net Banking

- ICICI Bank
- HDFC Bank
- State Bank of India
- Axis Bank
- Kotak Mahindra Bank

## Order Tracking Workflow

1. **Order Placement**: Customer completes checkout
2. **Payment Processing**: Payment is processed via API
3. **Order Confirmation**: Order status changes to "confirmed"
4. **Tracking Event Creation**: Initial tracking event is logged
5. **Shipping Status Updates**: Seller updates status as order progresses
6. **Customer Tracking**: Customer can track order at `/track-order`

## Status Lifecycle

```
pending → confirmed → processing → shipped → delivered
```

Each status transition:

- Updates order status in database
- Creates a tracking event with timestamp
- Records location information
- Stores descriptive message

## Security Considerations

- ✅ Card data validation on client-side
- ✅ HTTPS for all payment communications
- ✅ Never store full card details in database
- ✅ Use tokenization for saved cards
- ✅ CVV validation on payment submission
- ✅ Transaction ID generation for audit trail

## Production Integration

### Payment Gateway Integration

Replace mock payment processing with actual gateway:

```typescript
// In /api/process-payment/route.ts
// Integrate with Razorpay, Stripe, or PayU
const response = await initiatePaymentWithGateway({
  amount,
  currency: "INR",
  orderId,
  // ... other details
});
```

### Real-time Tracking Updates

Implement webhook handlers for:

- Courier partner API integrations
- Real-time status updates
- Automated SMS/Email notifications

## Error Handling

- Invalid order ID → 404 response
- Payment validation errors → 400 response
- Database errors → 500 response
- Amount mismatch → 400 response

## Testing

### Test Payment Information

```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123

UPI ID: test@bank
```

### Test Tracking

Use any valid Order ID from the database to track orders.

## Future Enhancements

- [ ] Email notifications for payment and shipment
- [ ] SMS tracking updates
- [ ] Webhook integration with courier partners
- [ ] Payment retry mechanism
- [ ] Multiple currency support
- [ ] Partial refunds
- [ ] Return order tracking
- [ ] Real-time location tracking with maps
- [ ] Estimated delivery time calculation
- [ ] Delivery signature capture

## Support

For issues or questions about the payment system, contact support or create an issue in the repository.
