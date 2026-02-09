/\*\*

- Navigation Integration Guide
-
- This file shows how to integrate Payment and Tracking links
- into your existing navigation/header components.
  \*/

// Example 1: Add to Header Component
// ====================================
// File: components/header.tsx

/\*
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function Header() {
const { user } = useAuth();

return (
<header className="bg-white shadow">
<nav className="max-w-7xl mx-auto px-4">
<div className="flex justify-between items-center py-4">

          {/* Logo and main nav... */}

          {/* Right side navigation */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                {/* New Links */}
                <Link
                  href="/track-order"
                  className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Track Orders
                </Link>

                <Link
                  href="/payment-methods"
                  className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Payment Methods
                </Link>
              </>
            )}

            {/* Existing profile, cart links... */}
          </div>
        </div>
      </nav>
    </header>

);
}
\*/

// Example 2: Add to User Profile Menu
// ====================================
// File: components/profile-menu.tsx

/\*
<DropdownMenu>
<DropdownMenuTrigger>Profile</DropdownMenuTrigger>
<DropdownMenuContent>
<DropdownMenuItem asChild>
<Link href="/profile">My Profile</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
<Link href="/orders">My Orders</Link>
</DropdownMenuItem>

    {/* NEW ITEMS */}
    <DropdownMenuItem asChild>
      <Link href="/track-order">Track Order</Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href="/payment-methods">Payment Methods</Link>
    </DropdownMenuItem>

    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>

  </DropdownMenuContent>
</DropdownMenu>
*/

// Example 3: Add to Orders Page
// ==============================
// File: app/orders/page.tsx

/\*
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
return (
<div>
<h1>My Orders</h1>

      {/* Track order button for each order */}
      {orders.map((order) => (
        <OrderCard key={order._id}>
          <h3>{order.orderNumber}</h3>
          <p>Status: {order.orderStatus}</p>

          {/* NEW: Track button */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/track-order?orderId=${order._id}`}>
              Track This Order
            </Link>
          </Button>
        </OrderCard>
      ))}
    </div>

);
}
\*/

// Example 4: Add to Checkout Page
// ================================
// File: app/checkout/page.tsx

/\*
import PaymentButton from "@/components/payment-button";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
const router = useRouter();
const { items, subtotal } = useCart();

// For traditional checkout with manual payment button
const handlePayment = () => {
const orderData = {
items,
subtotal,
shippingFee: 99,
tax: Math.round(subtotal \* 0.18),
userEmail: user?.email,
};

    localStorage.setItem("pendingOrder", JSON.stringify(orderData));
    router.push("/payment");

};

return (
<div className="space-y-6">
{/_ Checkout content _/}

      {/* Use PaymentButton component */}
      <PaymentButton />

      {/* Or use custom button */}
      <Button onClick={handlePayment} className="w-full">
        Proceed to Payment
      </Button>
    </div>

);
}
\*/

// Example 5: Add to Main Navigation Menu
// =======================================
// File: components/main-navigation.tsx

/\*
const navigationItems = [
{ label: "Shop", href: "/shop" },
{ label: "Orders", href: "/orders" },
{ label: "Track Order", href: "/track-order" }, // NEW
{ label: "Payment Methods", href: "/payment-methods" }, // NEW
{ label: "Contact", href: "/contact" },
];

export function MainNavigation() {
return (
<nav>
{navigationItems.map((item) => (
<Link key={item.href} href={item.href}>
{item.label}
</Link>
))}
</nav>
);
}
\*/

// Example 6: Add Quick Links Card
// ================================
// File: app/page.tsx (Home Page)

/\*

<section className="grid md:grid-cols-2 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Quick Links</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <Button asChild variant="outline" className="w-full">
        <Link href="/track-order">
          <Package className="w-4 h-4 mr-2" />
          Track Your Order
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/payment-methods">
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Payment Methods
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/orders">
          <ShoppingBag className="w-4 h-4 mr-2" />
          View My Orders
        </Link>
      </Button>
    </CardContent>
  </Card>
</section>
*/

// Example 7: Mobile Menu Integration
// ===================================
// File: components/mobile-menu.tsx

/_
<Sheet>
<SheetTrigger>Menu</SheetTrigger>
<SheetContent>
<nav className="space-y-4">
<Link href="/shop">Shop</Link>
<Link href="/orders">My Orders</Link>
<Link href="/track-order">Track Order</Link>
<Link href="/payment-methods">Payment Methods</Link>
<Link href="/profile">Profile</Link>
</nav>
</SheetContent>
</Sheet>
_/

// Example 8: Breadcrumb Navigation
// ================================
// File: components/breadcrumb.tsx

/\*
export function Breadcrumb({ path }: { path: string[] }) {
return (
<nav className="flex gap-2">
<Link href="/">Home</Link>
{path.map((segment, i) => (
<div key={i}>
<span>/</span>
<Link href={`/${path.slice(0, i + 1).join("/")}`}>
{segment.replace("-", " ").toUpperCase()}
</Link>
</div>
))}
</nav>
);
}

// Usage in /track-order page:
<Breadcrumb path={["track-order"]} />
\*/

// Example 9: Footer Links
// =======================
// File: components/footer.tsx

/\*

<footer>
  <div className="grid md:grid-cols-4 gap-8">
    <div>
      <h3>Customer Service</h3>
      <ul>
        <li><Link href="/track-order">Track Order</Link></li>
        <li><Link href="/payment-methods">Payment Methods</Link></li>
        <li><Link href="/faq">FAQ</Link></li>
        <li><Link href="/contact">Contact Us</Link></li>
      </ul>
    </div>
    {/* Other footer columns */}
  </div>
</footer>
*/

// Icons to use (from lucide-react)
// ================================
/_
import {
Package, // Track Order
CreditCard, // Payment Methods
ShoppingBag, // Orders
Truck, // Shipping
CheckCircle2, // Delivered
AlertCircle, // Issue
} from "lucide-react";
_/

// CSS Classes Useful for Styling
// ==============================
/\*
// For links
className="text-blue-600 hover:text-blue-800 flex items-center gap-2"

// For buttons
className="bg-blue-600 hover:bg-blue-700 text-white"

// For badges
className="bg-green-100 text-green-800 px-2 py-1 rounded"

// For cards
className="border rounded-lg p-4 shadow-sm hover:shadow-md"
\*/

// Common Patterns
// ===============

// 1. Link with Icon
export const LinkWithIcon = ({
href,
label,
icon: Icon
}: {
href: string;
label: string;
icon: React.ReactNode;
}) => (
<a
href={href}
className="flex items-center gap-2 hover:text-blue-600"

>

    {Icon}
    {label}

  </a>
);

// Usage:
// <LinkWithIcon
// href="/track-order"
// label="Track Order"
// icon={<Package className="w-4 h-4" />}
// />

// 2. Navigation Section
export const NavSection = ({
title,
items
}: {
title: string;
items: Array<{ label: string; href: string }>;
}) => (

  <div>
    <h3 className="font-semibold mb-3">{title}</h3>
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href} className="text-gray-600 hover:text-blue-600">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

// Usage:
// <NavSection
// title="Customer Service"
// items={[
// { label: "Track Order", href: "/track-order" },
// { label: "Payment Methods", href: "/payment-methods" },
// ]}
// />

export {};
