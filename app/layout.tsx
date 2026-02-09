import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./dropdown.css";
import "./product-zoom.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { BodyMetricsProvider } from "@/context/body-metrics-context";
import { AIProvider } from "@/context/ai-context";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pick&Fit - Shop, Try, and Fit – Your Style, Your Choice",
  description:
    "An e-commerce platform for in-house manufactured clothing, innerwear, shoes, and socks with try-at-home feature.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <BodyMetricsProvider>
                  <AIProvider>
                    <Header />
                    <main className="min-h-screen flex flex-col">
                      {children}
                    </main>
                    <Footer />
                  </AIProvider>
                </BodyMetricsProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
