/**
 * Email Service with SendGrid Integration
 * Handles sending transactional emails for order notifications
 */

import sgMail from "@sendgrid/mail";
import Order from "@/lib/db/models/Order";
import { connectDB } from "@/lib/db/connection";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  templateId: string;
  subject: string;
  variables: Record<string, string | number | boolean>;
}

export enum EmailType {
  ORDER_CONFIRMATION = "order_confirmation",
  PAYMENT_RECEIPT = "payment_receipt",
  SHIPPING = "shipping",
  DELIVERY = "delivery",
  REFUND = "refund",
  ORDER_CANCELLED = "order_cancelled",
  RESET_PASSWORD = "reset_password",
}

const EMAIL_CONFIG = {
  [EmailType.ORDER_CONFIRMATION]: {
    template:
      process.env.EMAIL_TEMPLATE_ORDER_CONFIRMATION || "order_confirmation",
    subject: "Order Confirmation - Pick and Fit",
  },
  [EmailType.PAYMENT_RECEIPT]: {
    template: process.env.EMAIL_TEMPLATE_PAYMENT_RECEIPT || "payment_receipt",
    subject: "Payment Receipt - Pick and Fit",
  },
  [EmailType.SHIPPING]: {
    template: process.env.EMAIL_TEMPLATE_SHIPPING || "shipping",
    subject: "Your Order is on the Way - Pick and Fit",
  },
  [EmailType.DELIVERY]: {
    template: process.env.EMAIL_TEMPLATE_DELIVERY || "delivery",
    subject: "Order Delivered - Pick and Fit",
  },
  [EmailType.REFUND]: {
    template: process.env.EMAIL_TEMPLATE_REFUND || "refund",
    subject: "Refund Processed - Pick and Fit",
  },
  [EmailType.ORDER_CANCELLED]: {
    template: process.env.EMAIL_TEMPLATE_ORDER_CANCELLED || "order_cancelled",
    subject: "Order Cancelled - Pick and Fit",
  },
  [EmailType.RESET_PASSWORD]: {
    template: process.env.EMAIL_TEMPLATE_RESET_PASSWORD || "reset_password",
    subject: "Reset Your Password - Pick and Fit",
  },
};

/**
 * Send email using SendGrid
 */
export async function sendEmail(
  to: string,
  emailType: EmailType,
  variables: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const config = EMAIL_CONFIG[emailType];

    if (!config) {
      throw new Error(`Unknown email type: ${emailType}`);
    }

    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL || "noreply@pickandfit.com";
    const fromName = process.env.SENDGRID_FROM_NAME || "Pick and Fit";

    // For SendGrid v3, we need to use MailHelper or send with HTML
    // This is a dynamic email approach. For production, use template IDs
    const message = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: config.subject,
      html: generateEmailHTML(emailType, variables),
      text: generateEmailText(emailType, variables),
    };

    await sgMail.send(message);

    console.log(`[Email] ${emailType} sent to ${to}`);
  } catch (error) {
    console.error(`[Email] Failed to send ${emailType}:`, error);

    // Don't throw - log and continue
    // In production, you might want to queue this for retry
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  orderId: string,
  customerEmail: string,
): Promise<void> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const variables = {
      customerName: order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber || orderId,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN"),
      orderTotal: order.totalAmount.toString(),
      itemCount: order.items.length.toString(),
      currency: process.env.DEFAULT_CURRENCY || "INR",
      shippingAddress: `${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state}`,
    };

    await sendEmail(customerEmail, EmailType.ORDER_CONFIRMATION, variables);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  orderId: string,
  customerEmail: string,
  paymentId: string,
): Promise<void> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const variables = {
      customerName: order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber || orderId,
      paymentId: paymentId,
      amount: order.totalAmount.toString(),
      currency: process.env.DEFAULT_CURRENCY || "INR",
      paymentDate: new Date().toLocaleDateString("en-IN"),
      paymentMethod: order.paymentMethod || "Card",
    };

    await sendEmail(customerEmail, EmailType.PAYMENT_RECEIPT, variables);
  } catch (error) {
    console.error("Failed to send payment receipt email:", error);
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingEmail(
  orderId: string,
  customerEmail: string,
  trackingNumber: string,
): Promise<void> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const variables = {
      customerName: order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber || orderId,
      trackingNumber: trackingNumber,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${orderId}`,
      estimatedDelivery: calculateEstimatedDelivery(),
    };

    await sendEmail(customerEmail, EmailType.SHIPPING, variables);
  } catch (error) {
    console.error("Failed to send shipping email:", error);
  }
}

/**
 * Send delivery confirmation email
 */
export async function sendDeliveryEmail(
  orderId: string,
  customerEmail: string,
): Promise<void> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const variables = {
      customerName: order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber || orderId,
      deliveryDate: new Date().toLocaleDateString("en-IN"),
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reviews/${orderId}`,
    };

    await sendEmail(customerEmail, EmailType.DELIVERY, variables);
  } catch (error) {
    console.error("Failed to send delivery email:", error);
  }
}

/**
 * Send refund notification email
 */
export async function sendRefundEmail(
  orderId: string,
  customerEmail: string,
  refundAmount: number,
): Promise<void> {
  try {
    const variables = {
      orderNumber: orderId,
      refundAmount: refundAmount.toString(),
      currency: process.env.DEFAULT_CURRENCY || "INR",
      refundDate: new Date().toLocaleDateString("en-IN"),
      estimatedRefundTime: "3-5 business days",
    };

    await sendEmail(customerEmail, EmailType.REFUND, variables);
  } catch (error) {
    console.error("Failed to send refund email:", error);
  }
}

/**
 * Send order cancellation email
 */
export async function sendCancellationEmail(
  orderId: string,
  customerEmail: string,
  reason?: string,
): Promise<void> {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const variables = {
      customerName: order.shippingAddress?.fullName || "Valued Customer",
      orderNumber: order.orderNumber || orderId,
      cancellationReason: reason || "Not specified",
      refundInfo:
        order.totalAmount > 0
          ? `Your payment will be refunded to your original payment method.`
          : "",
    };

    await sendEmail(customerEmail, EmailType.ORDER_CANCELLED, variables);
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  customerEmail: string,
  resetToken: string,
): Promise<void> {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    const variables = {
      resetUrl: resetUrl,
      expiryTime: "24 hours",
    };

    await sendEmail(customerEmail, EmailType.RESET_PASSWORD, variables);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  emailType: EmailType,
  variables: Record<string, string | number | boolean>,
): string {
  const baseHTML = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pick and Fit</h1>
          </div>
          <div class="content">
            ${renderEmailContent(emailType, variables)}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Pick and Fit. All rights reserved.</p>
            <p>If you have any questions, please contact us at support@pickandfit.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return baseHTML;
}

/**
 * Generate plain text email content
 */
function generateEmailText(
  emailType: EmailType,
  variables: Record<string, string | number | boolean>,
): string {
  let text = `Pick and Fit\n\n`;

  switch (emailType) {
    case EmailType.ORDER_CONFIRMATION:
      text += `Hello ${variables.customerName},\n\n`;
      text += `Thank you for your order!\n`;
      text += `Order Number: ${variables.orderNumber}\n`;
      text += `Order Date: ${variables.orderDate}\n`;
      text += `Total Amount: ${variables.currency} ${variables.orderTotal}\n\n`;
      break;

    case EmailType.SHIPPING:
      text += `Hello ${variables.customerName},\n\n`;
      text += `Your order is on the way!\n`;
      text += `Tracking Number: ${variables.trackingNumber}\n`;
      text += `Estimated Delivery: ${variables.estimatedDelivery}\n`;
      text += `Track your order: ${variables.trackingUrl}\n\n`;
      break;

    case EmailType.DELIVERY:
      text += `Hello ${variables.customerName},\n\n`;
      text += `Your order has been delivered!\n`;
      text += `Order Number: ${variables.orderNumber}\n`;
      text += `Delivery Date: ${variables.deliveryDate}\n\n`;
      break;

    default:
      text += `Order Details:\n`;
      Object.entries(variables).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
  }

  text += `If you have any questions, please contact us at support@pickandfit.com\n`;
  text += `\n© ${new Date().getFullYear()} Pick and Fit`;

  return text;
}

/**
 * Render email content based on type
 */
function renderEmailContent(
  emailType: EmailType,
  variables: Record<string, string | number | boolean>,
): string {
  switch (emailType) {
    case EmailType.ORDER_CONFIRMATION:
      return `
        <h2>Order Confirmed!</h2>
        <p>Hi ${variables.customerName},</p>
        <p>Thank you for your order. We're excited to get it to you!</p>
        <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
        <p><strong>Order Date:</strong> ${variables.orderDate}</p>
        <p><strong>Total Amount:</strong> ${variables.currency} ${variables.orderTotal}</p>
        <p><strong>Items:</strong> ${variables.itemCount}</p>
        <p><strong>Shipping Address:</strong><br/>${variables.shippingAddress}</p>
        <p>You will receive a shipping notification once your order is dispatched.</p>
      `;

    case EmailType.PAYMENT_RECEIPT:
      return `
        <h2>Payment Receipt</h2>
        <p>Hi ${variables.customerName},</p>
        <p>Your payment has been processed successfully.</p>
        <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
        <p><strong>Payment ID:</strong> ${variables.paymentId}</p>
        <p><strong>Amount:</strong> ${variables.currency} ${variables.amount}</p>
        <p><strong>Payment Date:</strong> ${variables.paymentDate}</p>
        <p><strong>Payment Method:</strong> ${variables.paymentMethod}</p>
      `;

    case EmailType.SHIPPING:
      return `
        <h2>Your Order is on the Way!</h2>
        <p>Hi ${variables.customerName},</p>
        <p>Great news! Your order has been shipped.</p>
        <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
        <p><strong>Tracking Number:</strong> ${variables.trackingNumber}</p>
        <p><strong>Estimated Delivery:</strong> ${variables.estimatedDelivery}</p>
        <a href="${variables.trackingUrl}" class="btn">Track Your Order</a>
      `;

    case EmailType.DELIVERY:
      return `
        <h2>Order Delivered!</h2>
        <p>Hi ${variables.customerName},</p>
        <p>Your order has been successfully delivered.</p>
        <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
        <p><strong>Delivery Date:</strong> ${variables.deliveryDate}</p>
        <p>We'd love to know what you think. Please share your feedback on your purchase.</p>
        <a href="${variables.reviewUrl}" class="btn">Leave a Review</a>
      `;

    case EmailType.REFUND:
      return `
        <h2>Refund Processed</h2>
        <p>Your refund has been processed.</p>
        <p><strong>Refund Amount:</strong> ${variables.currency} ${variables.refundAmount}</p>
        <p><strong>Processing Date:</strong> ${variables.refundDate}</p>
        <p><strong>Expected In Your Account:</strong> ${variables.estimatedRefundTime}</p>
      `;

    case EmailType.ORDER_CANCELLED:
      return `
        <h2>Order Cancelled</h2>
        <p>Hi ${variables.customerName},</p>
        <p>Your order has been cancelled.</p>
        <p><strong>Order Number:</strong> ${variables.orderNumber}</p>
        <p><strong>Reason:</strong> ${variables.cancellationReason}</p>
        <p>${variables.refundInfo}</p>
      `;

    default:
      return "<p>Email content not available</p>";
  }
}

/**
 * Calculate estimated delivery date (3-5 business days from now)
 */
function calculateEstimatedDelivery(): string {
  const date = new Date();
  date.setDate(date.getDate() + 4); // Add 4 days for conservative estimate
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}
