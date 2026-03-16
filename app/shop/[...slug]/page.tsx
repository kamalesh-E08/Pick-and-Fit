"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Filter, Grid3X3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mock product data
const mockProducts = [
  // Men's products
  {
    id: "1",
    name: "Classic White Shirt",
    price: 1299,
    image: "/mens-white-shirt-fashion.png",
    category: "casual-wear",
    subcategory: "shirts",
    gender: "men",
  },
  {
    id: "2",
    name: "Slim Fit Jeans",
    price: 1499,
    image: "/mens-slim-fit-jeans.png",
    category: "casual-wear",
    subcategory: "pants",
    gender: "men",
  },
  {
    id: "3",
    name: "Casual T-Shirt",
    price: 799,
    image: "/mens-casual-tshirt-fashion.png",
    category: "casual-wear",
    subcategory: "t-shirts",
    gender: "men",
  },
  {
    id: "4",
    name: "Formal Shirt",
    price: 1599,
    image: "/mens-formal-shirt-fashion.png",
    category: "formal-wear",
    subcategory: "shirts",
    gender: "men",
  },
  {
    id: "5",
    name: "Formal Pants",
    price: 1899,
    image: "/mens-formal-pants-fashion.png",
    category: "formal-wear",
    subcategory: "pants",
    gender: "men",
  },
  {
    id: "6",
    name: "Oversized Shirt",
    price: 1399,
    image: "/mens-oversized-shirt-fashion.png",
    category: "oversized-fit",
    subcategory: "shirts",
    gender: "men",
  },
  {
    id: "7",
    name: "Oversized Pants",
    price: 1699,
    image: "/mens-baggy-pants-fashion.png",
    category: "oversized-fit",
    subcategory: "pants",
    gender: "men",
  },
  {
    id: "8",
    name: "Polo T-Shirt",
    price: 999,
    image: "/placeholder.svg?key=kww7e",
    category: "oversized-fit",
    subcategory: "polo-t-shirts",
    gender: "men",
  },
  {
    id: "9",
    name: "Round Neck T-Shirt",
    price: 899,
    image: "/men-round-neck-t-shirt.png",
    category: "oversized-fit",
    subcategory: "round-neck-t-shirts",
    gender: "men",
  },
  {
    id: "10",
    name: "Oversized Hoodie",
    price: 1899,
    image: "/men-oversized-hoodie.png",
    category: "oversized-fit",
    subcategory: "hoodies",
    gender: "men",
  },
  {
    id: "11",
    name: "Vest",
    price: 499,
    image: "/men-white-vest-innerwear.png",
    category: "innerwear",
    subcategory: "vests",
    gender: "men",
  },
  {
    id: "12",
    name: "Gym Vest",
    price: 599,
    image: "/men-gym-tank-top.png",
    category: "innerwear",
    subcategory: "gym-vests",
    gender: "men",
  },
  {
    id: "13",
    name: "Briefs",
    price: 399,
    image: "/men-briefs-fashion.png",
    category: "innerwear",
    subcategory: "briefs",
    gender: "men",
  },

  // Women's products
  {
    id: "14",
    name: "Formal Shirt",
    price: 1499,
    image: "/formal-shirt-business-woman.png",
    category: "formal-wear",
    subcategory: "shirts",
    gender: "women",
  },
  {
    id: "15",
    name: "Casual Shirt",
    price: 1299,
    image: "/women-casual-shirt-fashion.png",
    category: "casual-wear",
    subcategory: "shirts",
    gender: "women",
  },
  {
    id: "16",
    name: "Casual Pants",
    price: 1399,
    image: "/placeholder.svg?key=3shue",
    category: "casual-wear",
    subcategory: "pants",
    gender: "women",
  },
  {
    id: "17",
    name: "Casual T-Shirt",
    price: 899,
    image: "/casual-tshirt-fashion.png",
    category: "casual-wear",
    subcategory: "t-shirts",
    gender: "women",
  },
  {
    id: "18",
    name: "Oversized Shirt",
    price: 1399,
    image: "/oversized-shirt-fashion.png",
    category: "oversized-fit",
    subcategory: "shirts",
    gender: "women",
  },
  {
    id: "19",
    name: "Oversized Pants",
    price: 1599,
    image: "/oversized-pants-fashion.png",
    category: "oversized-fit",
    subcategory: "pants",
    gender: "women",
  },
  {
    id: "20",
    name: "Polo T-Shirt",
    price: 999,
    image: "/women-polo-fashion.png",
    category: "oversized-fit",
    subcategory: "polo-t-shirts",
    gender: "women",
  },
  {
    id: "21",
    name: "Round Neck T-Shirt",
    price: 899,
    image: "/women-round-neck-t-shirt.png",
    category: "oversized-fit",
    subcategory: "round-neck-t-shirts",
    gender: "women",
  },
  {
    id: "22",
    name: "Oversized Hoodie",
    price: 1799,
    image: "/oversized-hoodie-fashion.png",
    category: "oversized-fit",
    subcategory: "hoodies",
    gender: "women",
  },
  {
    id: "23",
    name: "Bra",
    price: 799,
    image: "/lingerie-fashion-photography.png",
    category: "lingerie-innerwear",
    subcategory: "bra",
    gender: "women",
  },
  {
    id: "24",
    name: "Panties",
    price: 499,
    image: "/lingerie-fashion-photography.png",
    category: "lingerie-innerwear",
    subcategory: "panties",
    gender: "women",
  },
  {
    id: "25",
    name: "Casual Shoes",
    price: 1999,
    image: "/women-casual-shoes-fashion.png",
    category: "footwear",
    subcategory: "casual-shoes",
    gender: "women",
  },
  {
    id: "26",
    name: "Sport Shoes",
    price: 2499,
    image: "/athletic-fashion-women.png",
    category: "footwear",
    subcategory: "sport-shoes",
    gender: "women",
  },
  {
    id: "27",
    name: "Flip Flops",
    price: 699,
    image: "/women-flip-flops-fashion.png",
    category: "footwear",
    subcategory: "flip-flops-slippers",
    gender: "women",
  },
  {
    id: "28",
    name: "Heeled Sandals",
    price: 1899,
    image: "/heeled-sandals-fashion.png",
    category: "footwear",
    subcategory: "heeled-sandals",
    gender: "women",
  },
  {
    id: "29",
    name: "Heeled Shoes",
    price: 2299,
    image: "/heeled-shoes-fashion.png",
    category: "footwear",
    subcategory: "heeled-shoes",
    gender: "women",
  },
  {
    id: "30",
    name: "Sunglasses",
    price: 1299,
    image: "/fashionable-woman-sunglasses.png",
    category: "accessories",
    subcategory: "sunglasses",
    gender: "women",
  },
  {
    id: "31",
    name: "Wristwatch",
    price: 2499,
    image: "/wristwatch-fashion.png",
    category: "accessories",
    subcategory: "watches",
    gender: "women",
  },
  {
    id: "32",
    name: "Handbag",
    price: 1899,
    image: "/stylish-handbag-shoot.png",
    category: "accessories",
    subcategory: "bags",
    gender: "women",
  },
  {
    id: "33",
    name: "Leather Wallet",
    price: 999,
    image: "/women-leather-wallet-fashion.png",
    category: "accessories",
    subcategory: "belts-wallets",
    gender: "women",
  },
  {
    id: "34",
    name: "Patterned Socks",
    price: 399,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20patterned%20socks%20fashion%20photography",
    category: "accessories",
    subcategory: "socks",
    gender: "women",
  },
  {
    id: "35",
    name: "Fashion Top",
    price: 1199,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20fashion%20top%20fashion%20photography",
    category: "western-wear",
    subcategory: "tops",
    gender: "women",
  },
  {
    id: "36",
    name: "Skinny Jeans",
    price: 1699,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20skinny%20jeans%20fashion%20photography",
    category: "western-wear",
    subcategory: "jeans-jeggings",
    gender: "women",
  },
  {
    id: "37",
    name: "Pleated Skirt",
    price: 1299,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20pleated%20skirt%20fashion%20photography",
    category: "western-wear",
    subcategory: "skirts-shorts",
    gender: "women",
  },
  {
    id: "38",
    name: "Winter Jacket",
    price: 2999,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20winter%20jacket%20fashion%20photography",
    category: "western-wear",
    subcategory: "jackets-coats",
    gender: "women",
  },
  {
    id: "39",
    name: "Knit Sweater",
    price: 1799,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20knit%20sweater%20fashion%20photography",
    category: "western-wear",
    subcategory: "sweaters",
    gender: "women",
  },
  {
    id: "40",
    name: "Silk Kurta",
    price: 2499,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20silk%20kurta%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "kurtas",
    gender: "women",
  },
  {
    id: "41",
    name: "Cotton Churidar",
    price: 1299,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20cotton%20churidar%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "churidars",
    gender: "women",
  },
  {
    id: "42",
    name: "Embroidered Kurti",
    price: 1899,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20embroidered%20kurti%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "kurtis",
    gender: "women",
  },
  {
    id: "43",
    name: "Silk Saree",
    price: 4999,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20silk%20saree%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "sarees",
    gender: "women",
  },
  {
    id: "44",
    name: "Embroidered Dupatta",
    price: 1299,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20embroidered%20dupatta%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "dupattas",
    gender: "women",
  },
  {
    id: "45",
    name: "Diwali Special Dress",
    price: 3499,
    image:
      "/placeholder.svg?height=400&width=300&query=women%20diwali%20special%20dress%20indian%20fashion%20photography",
    category: "ethnic-festive",
    subcategory: "diwali-dresses",
    gender: "women",
  },
  // Kids - Boy products
  {
    id: "46",
    name: "Boys Cotton T-Shirt",
    price: 499,
    image:
      "/placeholder.svg?height=400&width=300&query=boys%20cotton%20t-shirt%20fashion%20photography",
    category: "clothing",
    subcategory: "tops",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: "47",
    name: "Boys Jeans",
    price: 799,
    image:
      "/placeholder.svg?height=400&width=300&query=boys%20jeans%20fashion%20photography",
    category: "clothing",
    subcategory: "bottoms",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: "48",
    name: "Boys Cotton Vest",
    price: 299,
    image:
      "/placeholder.svg?height=400&width=300&query=boys%20cotton%20vest%20innerwear%20fashion%20photography",
    category: "innerwear-sleepwear",
    subcategory: "vests",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: "49",
    name: "Boys Sports Shoes",
    price: 999,
    image:
      "/placeholder.svg?height=400&width=300&query=boys%20sports%20shoes%20fashion%20photography",
    category: "footwear",
    subcategory: "sports-shoes",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: "50",
    name: "Boys Kurta Set",
    price: 1299,
    image:
      "/placeholder.svg?height=400&width=300&query=boys%20kurta%20set%20indian%20traditional%20fashion%20photography",
    category: "festive-ethnic",
    subcategory: "kurta-sets",
    gender: "kids",
    kidGender: "boy",
  },

  // Kids - Girl products
  {
    id: "51",
    name: "Girls Floral Dress",
    price: 799,
    image:
      "/placeholder.svg?height=400&width=300&query=girls%20floral%20dress%20fashion%20photography",
    category: "clothing",
    subcategory: "dresses",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: "52",
    name: "Girls Cotton T-Shirt",
    price: 499,
    image:
      "/placeholder.svg?height=400&width=300&query=girls%20cotton%20t-shirt%20fashion%20photography",
    category: "clothing",
    subcategory: "tops",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: "53",
    name: "Girls Nightwear Set",
    price: 699,
    image:
      "/placeholder.svg?height=400&width=300&query=girls%20nightwear%20pajama%20set%20fashion%20photography",
    category: "innerwear-sleepwear",
    subcategory: "nightwear",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: "54",
    name: "Girls Sandals",
    price: 599,
    image:
      "/placeholder.svg?height=400&width=300&query=girls%20sandals%20footwear%20fashion%20photography",
    category: "footwear",
    subcategory: "sandals",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: "55",
    name: "Girls Lehenga",
    price: 1499,
    image:
      "/placeholder.svg?height=400&width=300&query=girls%20lehenga%20indian%20traditional%20fashion%20photography",
    category: "festive-ethnic",
    subcategory: "lehenga",
    gender: "kids",
    kidGender: "girl",
  },
  // Add these beauty products to the mockProducts array
  // Beauty products - Skincare
  {
    id: "56",
    name: "Gentle Facial Cleanser",
    price: 599,
    image: "/facial-cleanser-product.png",
    category: "skincare",
    subcategory: "cleanser",
    gender: "beauty",
  },
  {
    id: "57",
    name: "Hydrating Moisturizer",
    price: 799,
    image: "/moisturizer-skincare-product.png",
    category: "skincare",
    subcategory: "moisturisers",
    gender: "beauty",
  },
  {
    id: "58",
    name: "Vitamin C Serum",
    price: 1299,
    image: "/vitamin-c-serum-product.png",
    category: "skincare",
    subcategory: "serum",
    gender: "beauty",
  },
  {
    id: "59",
    name: "SPF 50 Sunscreen",
    price: 699,
    image:
      "/placeholder.svg?height=400&width=300&query=spf%2050%20sunscreen%20skincare%20product%20photography",
    category: "skincare",
    subcategory: "sunscreen",
    gender: "beauty",
  },
  {
    id: "60",
    name: "Anti-Aging Eye Cream",
    price: 899,
    image:
      "/placeholder.svg?height=400&width=300&query=anti-aging%20eye%20cream%20skincare%20product%20photography",
    category: "skincare",
    subcategory: "eye-cream",
    gender: "beauty",
  },
  {
    id: "61",
    name: "Nourishing Lip Balm",
    price: 299,
    image:
      "/placeholder.svg?height=400&width=300&query=nourishing%20lip%20balm%20skincare%20product%20photography",
    category: "skincare",
    subcategory: "lip-balm",
    gender: "beauty",
  },

  // Beauty products - Makeup
  {
    id: "62",
    name: "Matte Lipstick",
    price: 599,
    image: "/matte-lipstick-product.png",
    category: "makeup",
    subcategory: "lipstick",
    gender: "beauty",
  },
  {
    id: "63",
    name: "Shimmery Lip Gloss",
    price: 499,
    image:
      "/placeholder.svg?height=400&width=300&query=shimmery%20lip%20gloss%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "lip-gloss",
    gender: "beauty",
  },
  {
    id: "64",
    name: "Tinted Lip Balm",
    price: 399,
    image:
      "/placeholder.svg?height=400&width=300&query=tinted%20lip%20balm%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "lip-balm",
    gender: "beauty",
  },
  {
    id: "65",
    name: "Nail Polish Set",
    price: 799,
    image:
      "/placeholder.svg?height=400&width=300&query=nail%20polish%20set%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "nail-care",
    gender: "beauty",
  },
  {
    id: "66",
    name: "Volumizing Mascara",
    price: 699,
    image:
      "/placeholder.svg?height=400&width=300&query=volumizing%20mascara%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "mascara",
    gender: "beauty",
  },
  {
    id: "67",
    name: "Waterproof Eyeliner",
    price: 499,
    image:
      "/placeholder.svg?height=400&width=300&query=waterproof%20eyeliner%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "eyeliner-kajals",
    gender: "beauty",
  },
  {
    id: "68",
    name: "Liquid Foundation",
    price: 899,
    image:
      "/placeholder.svg?height=400&width=300&query=liquid%20foundation%20makeup%20product%20photography",
    category: "makeup",
    subcategory: "foundation",
    gender: "beauty",
  },

  // Beauty products - Haircare
  {
    id: "69",
    name: "Anti-Dandruff Shampoo",
    price: 499,
    image: "/shampoo-haircare-product.png",
    category: "haircare",
    subcategory: "shampoo",
    gender: "beauty",
  },
  {
    id: "70",
    name: "Moisturizing Conditioner",
    price: 549,
    image:
      "/placeholder.svg?height=400&width=300&query=moisturizing%20conditioner%20haircare%20product%20photography",
    category: "haircare",
    subcategory: "conditioner",
    gender: "beauty",
  },
  {
    id: "71",
    name: "Argan Hair Oil",
    price: 699,
    image:
      "/placeholder.svg?height=400&width=300&query=argan%20hair%20oil%20haircare%20product%20photography",
    category: "haircare",
    subcategory: "hair-oil",
    gender: "beauty",
  },
  {
    id: "72",
    name: "Ammonia-Free Hair Color",
    price: 899,
    image:
      "/placeholder.svg?height=400&width=300&query=ammonia-free%20hair%20color%20haircare%20product%20photography",
    category: "haircare",
    subcategory: "hair-color",
    gender: "beauty",
  },
  {
    id: "73",
    name: "Hair Styling Gel",
    price: 399,
    image:
      "/placeholder.svg?height=400&width=300&query=hair%20styling%20gel%20haircare%20product%20photography",
    category: "haircare",
    subcategory: "hair-styling",
    gender: "beauty",
  },

  // Beauty products - Fragrances
  {
    id: "74",
    name: "Floral Perfume",
    price: 1499,
    image:
      "/placeholder.svg?height=400&width=300&query=floral%20perfume%20fragrance%20product%20photography",
    category: "fragrances",
    subcategory: "perfumes",
    gender: "beauty",
  },
  {
    id: "75",
    name: "Long-lasting Deodorant",
    price: 299,
    image:
      "/placeholder.svg?height=400&width=300&query=long-lasting%20deodorant%20fragrance%20product%20photography",
    category: "fragrances",
    subcategory: "deodorants",
    gender: "beauty",
  },

  // Beauty products - Bath and Body
  {
    id: "76",
    name: "Exfoliating Face Wash",
    price: 399,
    image:
      "/placeholder.svg?height=400&width=300&query=exfoliating%20face%20wash%20bath%20body%20product%20photography",
    category: "bath-body",
    subcategory: "face-wash",
    gender: "beauty",
  },
  {
    id: "77",
    name: "Moisturizing Body Wash",
    price: 449,
    image:
      "/placeholder.svg?height=400&width=300&query=moisturizing%20body%20wash%20bath%20body%20product%20photography",
    category: "bath-body",
    subcategory: "body-wash",
    gender: "beauty",
  },
  {
    id: "78",
    name: "Coffee Body Scrub",
    price: 599,
    image:
      "/placeholder.svg?height=400&width=300&query=coffee%20body%20scrub%20bath%20body%20product%20photography",
    category: "bath-body",
    subcategory: "body-scrub",
    gender: "beauty",
  },

  // Beauty products - Men Grooming
  {
    id: "79",
    name: "Shaving Cream",
    price: 349,
    image:
      "/placeholder.svg?height=400&width=300&query=shaving%20cream%20men%20grooming%20product%20photography",
    category: "men-grooming",
    subcategory: "shaving-essentials",
    gender: "beauty",
  },
  {
    id: "80",
    name: "Beard Oil",
    price: 499,
    image: "/beard-oil-product.png",
    category: "men-grooming",
    subcategory: "beard-essentials",
    gender: "beauty",
  },
  {
    id: "81",
    name: "Hair Wax",
    price: 399,
    image:
      "/placeholder.svg?height=400&width=300&query=hair%20wax%20men%20grooming%20product%20photography",
    category: "men-grooming",
    subcategory: "hair-wax",
    gender: "beauty",
  },
  {
    id: "82",
    name: "Men's Deodorant",
    price: 299,
    image:
      "/placeholder.svg?height=400&width=300&query=mens%20deodorant%20men%20grooming%20product%20photography",
    category: "men-grooming",
    subcategory: "deodorants",
    gender: "beauty",
  },
];

// Category structure for filters
const categoryFilters = {
  men: {
    // Men's categories remain the same
    "casual-wear": ["shirts", "pants", "t-shirts"],
    "formal-wear": ["shirts", "pants"],
    "oversized-fit": [
      "shirts",
      "pants",
      "polo-t-shirts",
      "round-neck-t-shirts",
      "hoodies",
    ],
    innerwear: ["vests", "gym-vests", "briefs", "trunkers"],
    footwear: [
      "casual-shoes",
      "flip-flops-slippers",
      "formal-shoes",
      "sandals",
      "sneakers",
      "sports-shoes",
    ],
    accessories: [
      "backpacks",
      "bags-wallets",
      "belts",
      "caps-hats",
      "fashion-accessories",
      "luggage-trolleys",
      "socks",
      "sunglasses",
      "watches",
    ],
    "western-wear": [
      "jackets-coats",
      "jeans",
      "shorts-3-4ths",
      "sweatshirts-hoodies",
      "track-pants",
      "boxers",
    ],
    "night-lounge-wear": [],
    "ethnic-festive": ["dhotis", "shirts", "kurtas"],
  },
  women: {
    // Women's categories remain the same
    "formal-wear": ["shirts", "pants"],
    "casual-wear": ["shirts", "pants", "t-shirts"],
    "oversized-fit": [
      "shirts",
      "pants",
      "polo-t-shirts",
      "round-neck-t-shirts",
      "hoodies",
    ],
    "lingerie-innerwear": ["bra", "panties"],
    footwear: [
      "casual-shoes",
      "sport-shoes",
      "flip-flops-slippers",
      "heeled-sandals",
      "heeled-shoes",
    ],
    accessories: [
      "sunglasses",
      "watches",
      "bags",
      "belts-wallets",
      "socks",
      "caps",
      "luggage-trolleys",
    ],
    "western-wear": [
      "tops",
      "t-shirts",
      "jeans-jeggings",
      "trousers-pants",
      "shirts",
      "track-pants",
      "skirts-shorts",
      "jackets-coats",
      "sweatshirts-hoodies",
      "sweaters",
    ],
    "night-lounge-wear": [],
    "ethnic-festive": [
      "kurtas",
      "churidars",
      "kurtis",
      "sarees",
      "dupattas",
      "diwali-dresses",
    ],
  },
  kids: {
    // Kids categories remain the same
    boy: {
      clothing: ["tops", "bottoms", "sets"],
      "innerwear-sleepwear": ["underwear", "vests", "nightwear"],
      "toys-babycare": ["toys", "babycare-products"],
      footwear: ["casual-shoes", "sports-shoes", "sandals"],
      "festive-ethnic": ["kurta-sets", "traditional-wear"],
    },
    girl: {
      clothing: ["tops", "bottoms", "dresses", "sets"],
      "innerwear-sleepwear": ["underwear", "slips", "nightwear"],
      "toys-babycare": ["toys", "babycare-products"],
      footwear: ["casual-shoes", "flats", "sandals"],
      "festive-ethnic": ["lehenga", "salwar-sets", "traditional-wear"],
    },
  },
  // Add beauty categories
  beauty: {
    skincare: [
      "cleanser",
      "moisturisers",
      "serum",
      "sunscreen",
      "eye-cream",
      "lip-balm",
    ],
    makeup: [
      "lipstick",
      "lip-gloss",
      "lip-balm",
      "nail-care",
      "mascara",
      "eyeliner-kajals",
      "foundation",
    ],
    haircare: [
      "shampoo",
      "conditioner",
      "hair-oil",
      "hair-color",
      "hair-styling",
    ],
    fragrances: ["perfumes", "deodorants"],
    "bath-body": ["face-wash", "body-wash", "body-scrub"],
    "men-grooming": [
      "shaving-essentials",
      "beard-essentials",
      "hair-wax",
      "deodorants",
    ],
  },
};

// Helper function to get category name from slug
const getCategoryName = (slug: string) => {
  const categoryMap: { [key: string]: string } = {
    // Existing categories
    men: "Men",
    women: "Women",
    kids: "Kids",
    beauty: "Beauty",
    "casual-wear": "Casual Wear",
    "formal-wear": "Formal Wear",
    "oversized-fit": "Oversized Fit",
    innerwear: "Innerwear",
    "lingerie-innerwear": "Lingerie & Innerwear",
    footwear: "Footwear",
    accessories: "Accessories",
    "western-wear": "Western Wear",
    "night-lounge-wear": "Night and Lounge Wear",
    "ethnic-festive": "Ethnic and Festive",
    shirts: "Shirts",
    pants: "Pants",
    "t-shirts": "T-Shirts",
    "polo-t-shirts": "Polo T-Shirts",
    "round-neck-t-shirts": "Round Neck T-Shirts",
    hoodies: "Hoodies",
    vests: "Vests",
    "gym-vests": "Gym Vests",
    briefs: "Briefs",
    trunkers: "Trunkers",
    bra: "Bra",
    panties: "Panties",
    "casual-shoes": "Casual Shoes",
    "sport-shoes": "Sport Shoes",
    "flip-flops-slippers": "Flip Flops & Slippers",
    "heeled-sandals": "Heeled Sandals",
    "heeled-shoes": "Heeled Shoes",
    sunglasses: "Sunglasses",
    watches: "Watches",
    bags: "Bags",
    "belts-wallets": "Belts & Wallets",
    socks: "Socks",
    caps: "Caps",
    "luggage-trolleys": "Luggage & Trolleys",
    tops: "Tops",
    "jeans-jeggings": "Jeans & Jeggings",
    "trousers-pants": "Trousers & Pants",
    "track-pants": "Track Pants",
    "skirts-shorts": "Skirts & Shorts",
    "jackets-coats": "Jackets & Coats",
    "sweatshirts-hoodies": "Sweatshirts & Hoodies",
    sweaters: "Sweaters",
    kurtas: "Kurtas",
    churidars: "Churidars",
    kurtis: "Kurtis",
    sarees: "Sarees",
    dupattas: "Dupattas",
    "diwali-dresses": "Diwali Dresses",
    boy: "Boy",
    girl: "Girl",
    clothing: "Clothing",
    "innerwear-sleepwear": "Innerwear & Sleepwear",
    "toys-babycare": "Toys & Babycare",
    "festive-ethnic": "Festive & Ethnic Wear",
    tops: "Tops",
    bottoms: "Bottoms",
    sets: "Sets",
    underwear: "Underwear",
    "casual-shoes": "Casual Shoes",
    "sports-shoes": "Sport Shoes",
    sandals: "Sandals",
    "kurta-sets": "Kurta Sets",
    "traditional-wear": "Traditional Wear",
    dresses: "Dresses",
    slips: "Slips",
    flats: "Flats",
    lehenga: "Lehenga",
    "salwar-sets": "Salwar Sets",

    // Beauty categories
    skincare: "Skincare",
    makeup: "Makeup",
    haircare: "Haircare",
    fragrances: "Fragrances",
    "bath-body": "Bath & Body",
    "men-grooming": "Men's Grooming",

    // Skincare subcategories
    cleanser: "Cleanser",
    moisturisers: "Moisturisers",
    serum: "Serum",
    sunscreen: "Sunscreen",
    "eye-cream": "Eye Cream",
    "lip-balm": "Lip Balm",

    // Makeup subcategories
    lipstick: "Lipstick",
    "lip-gloss": "Lip Gloss",
    "nail-care": "Nail Care",
    mascara: "Mascara",
    "eyeliner-kajals": "Eyeliner & Kajals",
    foundation: "Foundation",

    // Haircare subcategories
    shampoo: "Shampoo",
    conditioner: "Conditioner",
    "hair-oil": "Hair Oil",
    "hair-color": "Hair Color",
    "hair-styling": "Hair Styling",

    // Fragrances subcategories
    perfumes: "Perfumes",
    deodorants: "Deodorants",

    // Bath and Body subcategories
    "face-wash": "Face Wash",
    "body-wash": "Body Wash",
    "body-scrub": "Body Scrub",

    // Men Grooming subcategories
    "shaving-essentials": "Shaving Essentials",
    "beard-essentials": "Beard Essentials",
    "hair-wax": "Hair Wax",
  };
  return categoryMap[slug] || slug;
};

// Updated getSubcategories function to properly handle beauty category
const getSubcategories = (
  gender: string,
  category: string,
  slugArray: string[],
) => {
  if (gender && category) {
    // Handle kids categories differently since they have an extra level
    if (gender === "kids") {
      // If category is boy or girl, return their subcategories
      if (category === "boy" || category === "girl") {
        return Object.keys(
          categoryFilters.kids[category as keyof typeof categoryFilters.kids],
        );
      }

      // If we're looking at a deeper level for kids, find the parent (boy/girl)
      // and then look for subcategories under the specified category
      const kidGender = slugArray[1]; // boy or girl
      const kidCategory = category; // clothing, innerwear-sleepwear, etc.

      if (
        kidGender &&
        (kidGender === "boy" || kidGender === "girl") &&
        categoryFilters.kids[kidGender as keyof typeof categoryFilters.kids][
          kidCategory as keyof (typeof categoryFilters.kids)[keyof typeof categoryFilters.kids]
        ]
      ) {
        return categoryFilters.kids[
          kidGender as keyof typeof categoryFilters.kids
        ][
          kidCategory as keyof (typeof categoryFilters.kids)[keyof typeof categoryFilters.kids]
        ];
      }

      return [];
    }

    // Handle beauty category
    if (gender === "beauty") {
      // If no specific beauty category is selected, return all beauty categories
      if (!category || category === "beauty") {
        return Object.keys(categoryFilters.beauty);
      }

      // If a beauty category is selected, return its subcategories
      if (
        categoryFilters.beauty[category as keyof typeof categoryFilters.beauty]
      ) {
        return categoryFilters.beauty[
          category as keyof typeof categoryFilters.beauty
        ];
      }

      return [];
    }

    // Handle regular men/women categories
    if (categoryFilters[gender as keyof typeof categoryFilters]) {
      return (
        categoryFilters[gender as keyof typeof categoryFilters][
          category as keyof (typeof categoryFilters)[keyof typeof categoryFilters]
        ] || []
      );
    }
  }
  return [];
};

export default function ShopPage() {
  const params = useParams();
  const slugArray = Array.isArray(params.slug) ? params.slug : [params.slug];

  const gender = slugArray[0] || "";
  const category = slugArray[1] || "";
  const subcategory = slugArray[2] || "";

  const [products, setProducts] = useState(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    subcategory ? [subcategory] : [],
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const loadLiveProducts = async () => {
      try {
        setIsLoadingProducts(true);

        const params = new URLSearchParams();
        if (gender) params.set("gender", gender);
        params.set("limit", "120");

        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) return;

        const data = await response.json();
        const liveProducts = Array.isArray(data?.products)
          ? data.products.map((item: any) => ({
              id: String(item.productId || item._id),
              name: item.name,
              price: Number(item.price || 0),
              image: item.mainImage || item.images?.[0] || "/placeholder.svg",
              category: item.category || "",
              subcategory: item.subcategory || "",
              gender: item.gender || "",
              kidGender:
                item.gender === "kids" &&
                (item.category === "boy" || item.category === "girl")
                  ? item.category
                  : undefined,
            }))
          : [];

        if (liveProducts.length > 0) {
          setProducts(liveProducts);
          setFilteredProducts(liveProducts);
        }
      } catch (error) {
        console.error("Failed to load live products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadLiveProducts();
  }, [gender]);

  // Filter products based on selected criteria
  useEffect(() => {
    let filtered = [...products];

    // Filter by gender
    if (gender) {
      filtered = filtered.filter((product) => product.gender === gender);

      // Handle kids specific filtering
      if (gender === "kids") {
        const kidGender = slugArray[1]; // boy or girl
        if (kidGender && (kidGender === "boy" || kidGender === "girl")) {
          filtered = filtered.filter(
            (product) => product.kidGender === kidGender,
          );

          // If we have a category for kids (like clothing, footwear)
          const kidCategory = slugArray[2];
          if (kidCategory) {
            filtered = filtered.filter(
              (product) => product.category === kidCategory,
            );

            // If we have a subcategory for kids (like tops, bottoms)
            const kidSubcategory = slugArray[3];
            if (kidSubcategory && selectedSubcategories.length > 0) {
              filtered = filtered.filter((product) =>
                selectedSubcategories.includes(product.subcategory),
              );
            }
          }
        }
      } else if (gender === "beauty") {
        // Handle beauty category filtering
        const beautyCategory = slugArray[1];
        if (beautyCategory) {
          filtered = filtered.filter(
            (product) => product.category === beautyCategory,
          );

          // If we have a subcategory for beauty (like cleanser, moisturisers)
          const beautySubcategory = slugArray[2];
          if (beautySubcategory) {
            filtered = filtered.filter(
              (product) => product.subcategory === beautySubcategory,
            );
          } else if (selectedSubcategories.length > 0) {
            // Filter by selected subcategories if any are selected
            filtered = filtered.filter((product) =>
              selectedSubcategories.includes(product.subcategory),
            );
          }
        }
      } else {
        // Handle normal categories (men, women)
        // Filter by category
        if (category) {
          filtered = filtered.filter(
            (product) => product.category === category,
          );
        }

        // Filter by selected subcategories
        if (selectedSubcategories.length > 0) {
          filtered = filtered.filter((product) =>
            selectedSubcategories.includes(product.subcategory),
          );
        }
      }
    }

    // Filter by price range
    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1],
    );

    // Sort products
    if (sortBy === "price-low-high") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high-low") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      // In a real app, you would sort by date
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    setFilteredProducts(filtered);
  }, [
    products,
    gender,
    category,
    slugArray,
    selectedSubcategories,
    priceRange,
    sortBy,
  ]);

  // Toggle subcategory selection
  const toggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subcategory)
        ? prev.filter((item) => item !== subcategory)
        : [...prev, subcategory],
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSubcategories([]);
    setPriceRange([0, 5000]);
  };

  // Get available subcategories for the current category
  const availableSubcategories = getSubcategories(gender, category, slugArray);

  // Build breadcrumb path
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
  ];

  if (gender) {
    breadcrumbItems.push({
      name: getCategoryName(gender),
      href: `/shop/${gender}`,
    });
  }

  if (category) {
    breadcrumbItems.push({
      name: getCategoryName(category),
      href: `/shop/${gender}/${category}`,
    });
  }

  if (subcategory) {
    breadcrumbItems.push({
      name: getCategoryName(subcategory),
      href: `/shop/${gender}/${category}/${subcategory}`,
    });
  }

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex flex-wrap items-center text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground">/</span>
              )}
              {index === breadcrumbItems.length - 1 ? (
                <span className="font-medium">{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {subcategory
            ? `${getCategoryName(subcategory)} ${getCategoryName(category)}`
            : category
              ? getCategoryName(category)
              : gender
                ? `${getCategoryName(gender)}'s Collection`
                : "All Products"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isLoadingProducts
            ? "Loading products..."
            : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"} available`}
        </p>
      </div>

      {/* Mobile Filter Button */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-[350px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Mobile Filters */}
              <div className="flex-1 overflow-y-auto">
                {/* Subcategories */}
                {availableSubcategories.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3">
                      {gender === "beauty" && !category
                        ? "Categories"
                        : "Subcategories"}
                    </h3>
                    <div className="space-y-2">
                      {availableSubcategories.map((sub) => (
                        <div key={sub} className="flex items-center">
                          <Checkbox
                            id={`mobile-${sub}`}
                            checked={selectedSubcategories.includes(sub)}
                            onCheckedChange={() => toggleSubcategory(sub)}
                          />
                          <label
                            htmlFor={`mobile-${sub}`}
                            className="ml-2 text-sm cursor-pointer"
                          >
                            {getCategoryName(sub)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Price Range</h3>
                  <div className="px-2">
                    <Slider
                      defaultValue={[0, 5000]}
                      max={5000}
                      step={100}
                      value={priceRange}
                      onValueChange={(value) =>
                        setPriceRange(value as [number, number])
                      }
                      className="mb-4"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">₹{priceRange[0]}</span>
                      <span className="text-sm">₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  className="w-full"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <select
            className="text-sm border rounded-md px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
          </select>

          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`p-1 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              className={`p-1 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-[calc(14rem+1px)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Subcategories */}
            {availableSubcategories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">
                  {gender === "beauty" && !category
                    ? "Categories"
                    : "Subcategories"}
                </h3>
                <div className="space-y-2">
                  {availableSubcategories.map((sub) => (
                    <div key={sub} className="flex items-center">
                      <Checkbox
                        id={sub}
                        checked={selectedSubcategories.includes(sub)}
                        onCheckedChange={() => toggleSubcategory(sub)}
                      />
                      <label
                        htmlFor={sub}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {getCategoryName(sub)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Price Range</h3>
              <div className="px-2">
                <Slider
                  defaultValue={[0, 5000]}
                  max={5000}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) =>
                    setPriceRange(value as [number, number])
                  }
                  className="mb-4"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">₹{priceRange[0]}</span>
                  <span className="text-sm">₹{priceRange[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Desktop Sort and View Options */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <select
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>

            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`p-1 ${viewMode === "grid" ? "bg-muted" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                className={`p-1 ${viewMode === "list" ? "bg-muted" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium mb-4">No products found</p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search criteria
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  {viewMode === "grid" ? (
                    <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="mt-1 font-medium text-sm">
                          ₹{product.price.toLocaleString("en-IN")}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden transition-all hover:shadow-md">
                      <div className="flex">
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-3 flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="mt-1 font-medium">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {getCategoryName(product.subcategory)}
                          </p>
                        </CardContent>
                      </div>
                    </Card>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
