"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Menu, Heart, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import HierarchicalDropdown from "@/components/hierarchical-dropdown";
import BeautyHierarchicalDropdown from "@/components/beauty-hierarchical-dropdown";
import MobileCategoryMenu from "@/components/mobile-category-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Category data with detailed subcategories
const categories = [
  {
    name: "Men",
    href: "/men", // Changed from "/shop/men" to "/men"
    subcategories: [
      {
        name: "Casual Wear",
        href: "/shop/men/casual-wear",
        subItems: [
          { name: "Shirts", href: "/shop/men/casual-wear/shirts" },
          { name: "Pants", href: "/shop/men/casual-wear/pants" },
          { name: "T-Shirts", href: "/shop/men/casual-wear/t-shirts" },
        ],
      },
      {
        name: "Formal Wear",
        href: "/shop/men/formal-wear",
        subItems: [
          { name: "Shirts", href: "/shop/men/formal-wear/shirts" },
          { name: "Pants", href: "/shop/men/formal-wear/pants" },
        ],
      },
      {
        name: "Oversized Fit",
        href: "/shop/men/oversized-fit",
        subItems: [
          { name: "Shirts", href: "/shop/men/oversized-fit/shirts" },
          { name: "Pants", href: "/shop/men/oversized-fit/pants" },
          {
            name: "Polo T-Shirts",
            href: "/shop/men/oversized-fit/polo-t-shirts",
          },
          {
            name: "Round Neck T-Shirts",
            href: "/shop/men/oversized-fit/round-neck-t-shirts",
          },
          { name: "Hoodies", href: "/shop/men/oversized-fit/hoodies" },
        ],
      },
      {
        name: "Innerwear",
        href: "/shop/men/innerwear",
        subItems: [
          { name: "Vests", href: "/shop/men/innerwear/vests" },
          { name: "Gym Vests", href: "/shop/men/innerwear/gym-vests" },
          { name: "Briefs", href: "/shop/men/innerwear/briefs" },
          { name: "Trunkers", href: "/shop/men/innerwear/trunkers" },
        ],
      },
      {
        name: "Footwear",
        href: "/shop/men/footwear",
        subItems: [
          { name: "Casual Shoes", href: "/shop/men/footwear/casual-shoes" },
          {
            name: "Flip Flops & Slippers",
            href: "/shop/men/footwear/flip-flops-slippers",
          },
          { name: "Formal Shoes", href: "/shop/men/footwear/formal-shoes" },
          { name: "Sandals", href: "/shop/men/footwear/sandals" },
          { name: "Sneakers", href: "/shop/men/footwear/sneakers" },
          { name: "Sports Shoes", href: "/shop/men/footwear/sports-shoes" },
        ],
      },
      {
        name: "Accessories",
        href: "/shop/men/accessories",
        subItems: [
          { name: "Backpacks", href: "/shop/men/accessories/backpacks" },
          {
            name: "Bags & Wallets",
            href: "/shop/men/accessories/bags-wallets",
          },
          { name: "Belts", href: "/shop/men/accessories/belts" },
          { name: "Caps & Hats", href: "/shop/men/accessories/caps-hats" },
          {
            name: "Fashion Accessories",
            href: "/shop/men/accessories/fashion-accessories",
          },
          {
            name: "Luggage & Trolleys",
            href: "/shop/men/accessories/luggage-trolleys",
          },
          { name: "Socks", href: "/shop/men/accessories/socks" },
          { name: "Sunglasses", href: "/shop/men/accessories/sunglasses" },
          { name: "Watches", href: "/shop/men/accessories/watches" },
        ],
      },
      {
        name: "Western Wear",
        href: "/shop/men/western-wear",
        subItems: [
          {
            name: "Jackets & Coats",
            href: "/shop/men/western-wear/jackets-coats",
          },
          { name: "Jeans", href: "/shop/men/western-wear/jeans" },
          {
            name: "Shorts & 3/4ths",
            href: "/shop/men/western-wear/shorts-3-4ths",
          },
          {
            name: "Sweatshirts & Hoodies",
            href: "/shop/men/western-wear/sweatshirts-hoodies",
          },
          { name: "Track Pants", href: "/shop/men/western-wear/track-pants" },
          { name: "Boxers", href: "/shop/men/western-wear/boxers" },
        ],
      },
      { name: "Night and Lounge Wear", href: "/shop/men/night-lounge-wear" },
      {
        name: "Ethnic and Festive",
        href: "/shop/men/ethnic-festive",
        subItems: [
          { name: "Dhotis", href: "/shop/men/ethnic-festive/dhotis" },
          { name: "Shirts", href: "/shop/men/ethnic-festive/shirts" },
          { name: "Kurtas", href: "/shop/men/ethnic-festive/kurtas" },
        ],
      },
    ],
  },
  {
    name: "Women",
    href: "/women", // Changed from "/shop/women" to "/women"
    subcategories: [
      {
        name: "Formal Wear",
        href: "/shop/women/formal-wear",
        subItems: [
          { name: "Shirts", href: "/shop/women/formal-wear/shirts" },
          { name: "Pants", href: "/shop/women/formal-wear/pants" },
        ],
      },
      {
        name: "Casual Wear",
        href: "/shop/women/casual-wear",
        subItems: [
          { name: "Shirts", href: "/shop/women/casual-wear/shirts" },
          { name: "Pants", href: "/shop/women/casual-wear/pants" },
          { name: "T-Shirts", href: "/shop/women/casual-wear/t-shirts" },
        ],
      },
      {
        name: "Oversized Fit",
        href: "/shop/women/oversized-fit",
        subItems: [
          { name: "Shirts", href: "/shop/women/oversized-fit/shirts" },
          { name: "Pants", href: "/shop/women/oversized-fit/pants" },
          {
            name: "Polo T-Shirts",
            href: "/shop/women/oversized-fit/polo-t-shirts",
          },
          {
            name: "Round Neck T-Shirts",
            href: "/shop/women/oversized-fit/round-neck-t-shirts",
          },
          { name: "Hoodies", href: "/shop/women/oversized-fit/hoodies" },
        ],
      },
      {
        name: "Lingerie and Innerwear",
        href: "/shop/women/lingerie-innerwear",
        subItems: [
          { name: "Bra", href: "/shop/women/lingerie-innerwear/bra" },
          { name: "Panties", href: "/shop/women/lingerie-innerwear/panties" },
        ],
      },
      {
        name: "Footwear",
        href: "/shop/women/footwear",
        subItems: [
          { name: "Casual Shoes", href: "/shop/women/footwear/casual-shoes" },
          { name: "Sport Shoes", href: "/shop/women/footwear/sport-shoes" },
          {
            name: "Flip Flops & Slippers",
            href: "/shop/women/footwear/flip-flops-slippers",
          },
          {
            name: "Heeled Sandals",
            href: "/shop/women/footwear/heeled-sandals",
          },
          { name: "Heeled Shoes", href: "/shop/women/footwear/heeled-shoes" },
        ],
      },
      {
        name: "Accessories",
        href: "/shop/women/accessories",
        subItems: [
          { name: "Sunglasses", href: "/shop/women/accessories/sunglasses" },
          { name: "Watches", href: "/shop/women/accessories/watches" },
          { name: "Bags", href: "/shop/women/accessories/bags" },
          {
            name: "Belts & Wallets",
            href: "/shop/women/accessories/belts-wallets",
          },
          { name: "Socks", href: "/shop/women/accessories/socks" },
          { name: "Caps", href: "/shop/women/accessories/caps" },
          {
            name: "Luggage & Trolleys",
            href: "/shop/women/accessories/luggage-trolleys",
          },
        ],
      },
      {
        name: "Western Wear",
        href: "/shop/women/western-wear",
        subItems: [
          { name: "Tops", href: "/shop/women/western-wear/tops" },
          { name: "T-Shirts", href: "/shop/women/western-wear/t-shirts" },
          {
            name: "Jeans & Jeggings",
            href: "/shop/women/western-wear/jeans-jeggings",
          },
          {
            name: "Trousers & Pants",
            href: "/shop/women/western-wear/trousers-pants",
          },
          { name: "Shirts", href: "/shop/women/western-wear/shirts" },
          { name: "Track Pants", href: "/shop/women/western-wear/track-pants" },
          {
            name: "Skirts & Shorts",
            href: "/shop/women/western-wear/skirts-shorts",
          },
          {
            name: "Jackets & Coats",
            href: "/shop/women/western-wear/jackets-coats",
          },
          {
            name: "Sweatshirts & Hoodies",
            href: "/shop/women/western-wear/sweatshirts-hoodies",
          },
          { name: "Sweaters", href: "/shop/women/western-wear/sweaters" },
        ],
      },
      { name: "Night and Lounge Wear", href: "/shop/women/night-lounge-wear" },
      {
        name: "Ethnic and Festive",
        href: "/shop/women/ethnic-festive",
        subItems: [
          { name: "Kurtas", href: "/shop/women/ethnic-festive/kurtas" },
          { name: "Churidars", href: "/shop/women/ethnic-festive/churidars" },
          { name: "Kurtis", href: "/shop/women/ethnic-festive/kurtis" },
          { name: "Sarees", href: "/shop/women/ethnic-festive/sarees" },
          { name: "Dupattas", href: "/shop/women/ethnic-festive/dupattas" },
          {
            name: "Diwali Dresses",
            href: "/shop/women/ethnic-festive/diwali-dresses",
          },
        ],
      },
    ],
  },
  {
    name: "Kids",
    href: "/kids", // Changed from "/shop/kids" to "/kids"
    subcategories: [
      {
        name: "Boy",
        href: "/shop/kids/boy",
        subItems: [
          { name: "Clothing", href: "/shop/kids/boy/clothing" },
          {
            name: "Innerwear and Sleepwear",
            href: "/shop/kids/boy/innerwear-sleepwear",
          },
          { name: "Toys and Babycare", href: "/shop/kids/boy/toys-babycare" },
          { name: "Footwear", href: "/shop/kids/boy/footwear" },
          {
            name: "Festive and Ethnic Wear",
            href: "/shop/kids/boy/festive-ethnic",
          },
        ],
      },
      {
        name: "Girl",
        href: "/shop/kids/girl",
        subItems: [
          { name: "Clothing", href: "/shop/kids/girl/clothing" },
          {
            name: "Innerwear and Sleepwear",
            href: "/shop/kids/girl/innerwear-sleepwear",
          },
          { name: "Toys and Babycare", href: "/shop/kids/girl/toys-babycare" },
          { name: "Footwear", href: "/shop/kids/girl/footwear" },
          {
            name: "Festive and Ethnic Wear",
            href: "/shop/kids/girl/festive-ethnic",
          },
        ],
      },
    ],
  },
  {
    name: "Beauty",
    href: "/beauty", // Changed from "/shop/beauty" to "/beauty"
    subcategories: [
      {
        name: "Skincare",
        href: "/shop/beauty/skincare",
        subItems: [
          { name: "Cleanser", href: "/shop/beauty/skincare/cleanser" },
          { name: "Moisturisers", href: "/shop/beauty/skincare/moisturisers" },
          { name: "Serum", href: "/shop/beauty/skincare/serum" },
          { name: "Sunscreen", href: "/shop/beauty/skincare/sunscreen" },
          { name: "Eye Cream", href: "/shop/beauty/skincare/eye-cream" },
          { name: "Lip Balm", href: "/shop/beauty/skincare/lip-balm" },
        ],
      },
      {
        name: "Makeup",
        href: "/shop/beauty/makeup",
        subItems: [
          { name: "Lipstick", href: "/shop/beauty/makeup/lipstick" },
          { name: "Lip Gloss", href: "/shop/beauty/makeup/lip-gloss" },
          { name: "Lip Balm", href: "/shop/beauty/makeup/lip-balm" },
          { name: "Nail Care", href: "/shop/beauty/makeup/nail-care" },
          { name: "Mascara", href: "/shop/beauty/makeup/mascara" },
          {
            name: "Eyeliner & Kajals",
            href: "/shop/beauty/makeup/eyeliner-kajals",
          },
          { name: "Foundation", href: "/shop/beauty/makeup/foundation" },
        ],
      },
      {
        name: "Haircare",
        href: "/shop/beauty/haircare",
        subItems: [
          { name: "Shampoo", href: "/shop/beauty/haircare/shampoo" },
          { name: "Conditioner", href: "/shop/beauty/haircare/conditioner" },
          { name: "Hair Oil", href: "/shop/beauty/haircare/hair-oil" },
          { name: "Hair Color", href: "/shop/beauty/haircare/hair-color" },
          { name: "Hair Styling", href: "/shop/beauty/haircare/hair-styling" },
        ],
      },
      {
        name: "Fragrances",
        href: "/shop/beauty/fragrances",
        subItems: [
          { name: "Perfumes", href: "/shop/beauty/fragrances/perfumes" },
          { name: "Deodorants", href: "/shop/beauty/fragrances/deodorants" },
        ],
      },
      {
        name: "Bath and Body",
        href: "/shop/beauty/bath-body",
        subItems: [
          { name: "Face Wash", href: "/shop/beauty/bath-body/face-wash" },
          { name: "Body Wash", href: "/shop/beauty/bath-body/body-wash" },
          { name: "Body Scrub", href: "/shop/beauty/bath-body/body-scrub" },
        ],
      },
      {
        name: "Men Grooming",
        href: "/shop/beauty/men-grooming",
        subItems: [
          {
            name: "Shaving Essentials",
            href: "/shop/beauty/men-grooming/shaving-essentials",
          },
          {
            name: "Beard Essentials",
            href: "/shop/beauty/men-grooming/beard-essentials",
          },
          { name: "Hair Wax", href: "/shop/beauty/men-grooming/hair-wax" },
          { name: "Deodorants", href: "/shop/beauty/men-grooming/deodorants" },
        ],
      },
    ],
  },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get user initials (first two letters of name)
  const getUserInitials = () => {
    if (!user || !user.name) return "";
    const nameParts = user.name.split(" ");
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      {/* Top info bar */}
      <div className="bg-primary/10 py-1 text-xs font-medium hidden md:block">
        <div className="container flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Mumbai, India</span>
            </div>
          </div>
          <div>
            <span className="animate-pulse">
              Free shipping on orders over ₹999!
            </span>
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="container border-b">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo and Brand Name */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <div className="relative overflow-hidden">
              <Image
                src="/pick-and-fit-logo.png"
                alt="Pick&Fit Logo"
                width={32}
                height={32}
                className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Pick&Fit
              </span>
              <span className="text-[10px] text-muted-foreground">
                Shop, Try, Keep
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-auto px-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full h-9 pl-10 pr-4 border-muted group-hover:border-primary transition-colors"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-5">
              <Button
                variant="ghost"
                size="sm"
                className="relative group h-9 px-2"
              >
                <Heart className="h-[18px] w-[18px] group-hover:text-red-500 transition-colors" />
                <span className="sr-only">Wishlist</span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  2
                </span>
              </Button>

              <Link href="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative group h-9 px-2"
                >
                  <ShoppingBag className="h-[18px] w-[18px] group-hover:text-green-500 transition-colors" />
                  <span className="sr-only">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              <ThemeToggle />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {getUserInitials()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-red-500"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="group overflow-hidden relative h-9"
                  asChild
                >
                  <Link href="/signin">
                    <span className="relative z-10 group-hover:text-white transition-colors">
                      Sign In
                    </span>
                    <span className="absolute inset-0 bg-primary w-0 group-hover:w-full transition-all duration-300 ease-in-out -z-0"></span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/cart" className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative group h-9 px-2"
                >
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  <span className="sr-only">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-2">
                    <Menu className="h-[18px] w-[18px]" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                  <div className="flex flex-col h-full">
                    <div className="py-4 border-b">
                      <div className="flex items-center space-x-2 mb-4">
                        <Input
                          type="search"
                          placeholder="Search products..."
                          className="w-full"
                        />
                      </div>
                      {!user ? (
                        <div className="flex gap-2 mt-4">
                          <Button className="w-full" asChild>
                            <Link href="/signin">Sign In</Link>
                          </Button>
                          <Button variant="outline" className="w-full" asChild>
                            <Link href="/signup">Sign Up</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            {getUserInitials()}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <MobileCategoryMenu
                      categories={categories}
                      onClose={() =>
                        document
                          .querySelector("[data-radix-collection-item]")
                          ?.click()
                      }
                    />
                    <div className="mt-auto border-t py-4">
                      <div className="flex items-center justify-around">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative"
                        >
                          <Heart className="h-5 w-5" />
                          <span className="sr-only">Wishlist</span>
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            2
                          </span>
                        </Button>
                        <ThemeToggle />
                        {user && (
                          <Button variant="ghost" size="icon" onClick={signOut}>
                            <LogOut className="h-5 w-5 text-red-500" />
                            <span className="sr-only">Sign out</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Categories row */}
      <div className="container border-b max-w-screen-2xl mx-auto">
        <div className="hidden md:flex h-10 items-center justify-center px-4 relative">
          <nav className="flex items-center gap-8">
            {categories.map((category) => {
              if (category.name === "Beauty") {
                return (
                  <BeautyHierarchicalDropdown
                    key={category.name}
                    name={category.name}
                    subcategories={category.subcategories}
                    href={category.href}
                  />
                );
              }
              return (
                <HierarchicalDropdown
                  key={category.name}
                  name={category.name}
                  subcategories={category.subcategories}
                  href={category.href}
                />
              );
            })}
            <Link
              href="/new-arrivals"
              className="text-sm font-medium transition-colors hover:text-primary relative group"
            >
              New Arrivals
              <Badge className="ml-1 bg-red-500 hover:bg-red-600 absolute -top-3 -right-8 text-[10px] py-0">
                New
              </Badge>
            </Link>
            <Link
              href="/sale"
              className="text-sm font-medium transition-colors hover:text-primary relative group"
            >
              Sale
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Search (only visible on mobile) */}
      <div className="md:hidden container border-b py-2 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full h-9 pl-10 pr-4"
          />
        </div>
      </div>
    </header>
  );
}
