/**
 * Payment Utilities
 * Helper functions for payment processing and validation
 */

/**
 * Validate credit card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.length !== 16) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card brand from card number
 */
export function detectCardBrand(
  cardNumber: string,
): "visa" | "mastercard" | "amex" | "discover" | "unknown" {
  const number = cardNumber.replace(/\D/g, "");

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(number)) {
    return "visa";
  } else if (/^5[1-5][0-9]{14}$/.test(number)) {
    return "mastercard";
  } else if (/^3[47][0-9]{13}$/.test(number)) {
    return "amex";
  } else if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(number)) {
    return "discover";
  }

  return "unknown";
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.replace(/(\d{4})/g, "$1 ").trim();
}

/**
 * Validate UPI ID format
 */
export function validateUPIId(upiId: string): boolean {
  const upiPattern = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z]{3,}$/;
  return upiPattern.test(upiId);
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split("/");

  if (!month || !year || month.length !== 2 || year.length !== 2) {
    return false;
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (yearNum < currentYear) {
    return false;
  }

  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validate CVV (3 or 4 digits)
 */
export function validateCVV(cvv: string): boolean {
  const cvvPattern = /^\d{3,4}$/;
  return cvvPattern.test(cvv);
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

/**
 * Calculate payment summary
 */
export interface PaymentSummary {
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
}

export function calculatePaymentSummary(
  subtotal: number,
  shippingFee: number = 99,
  taxRate: number = 0.18,
  discount: number = 0,
): PaymentSummary {
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + shippingFee + tax - discount;

  return {
    subtotal,
    shippingFee,
    tax,
    discount,
    total,
  };
}

/**
 * Format currency (Indian Rupees)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for tracking
 */
export function formatTrackingDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(
  status: "pending" | "paid" | "failed" | "refunded",
): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-blue-100 text-blue-800",
  };

  return colors[status] || colors.pending;
}

/**
 * Get order status badge color
 */
export function getOrderStatusColor(
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled",
): string {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return colors[status] || colors.pending;
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return `xxxx xxxx xxxx ${digits.slice(-4)}`;
}

/**
 * Estimate delivery date (default: 7 business days)
 */
export function estimateDeliveryDate(
  fromDate: Date = new Date(),
  businessDays: number = 7,
): Date {
  let days = 0;
  const estimatedDate = new Date(fromDate);

  while (days < businessDays) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);

    // Skip weekends
    if (estimatedDate.getDay() !== 0 && estimatedDate.getDay() !== 6) {
      days++;
    }
  }

  return estimatedDate;
}
