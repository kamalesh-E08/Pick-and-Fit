"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Filter, Grid3X3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Mock product data (simplified version for women's products)
const mockProducts = [
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
    name: "Formal Pants",
    price: 1799,
    image: "/formal-pants-business-fashion.png",
    category: "formal-wear",
    subcategory: "pants",
    gender: "women",
  },
  {
    id: "16",
    name: "Casual Shirt",
    price: 1299,
    image: "/women-casual-shirt-fashion.png",
    category: "casual-wear",
    subcategory: "shirts",
    gender: "women",
  },
  {
    id: "17",
    name: "Casual Pants",
    price: 1399,
    image: "/women-casual-pants.png",
    category: "casual-wear",
    subcategory: "pants",
    gender: "women",
  },
  {
    id: "18",
    name: "Casual T-Shirt",
    price: 899,
    image: "/casual-tshirt-fashion.png",
    category: "casual-wear",
    subcategory: "t-shirts",
    gender: "women",
  },
  {
    id: "19",
    name: "Oversized Shirt",
    price: 1399,
    image: "/oversized-shirt-fashion.png",
    category: "oversized-fit",
    subcategory: "shirts",
    gender: "women",
  },
  {
    id: "20",
    name: "Oversized Pants",
    price: 1599,
    image: "/oversized-pants-fashion.png",
    category: "oversized-fit",
    subcategory: "pants",
    gender: "women",
  },
  {
    id: "21",
    name: "Polo T-Shirt",
    price: 999,
    image: "/women-polo-fashion.png",
    category: "casual-wear",
    subcategory: "polo-t-shirts",
    gender: "women",
  },
  {
    id: "22",
    name: "Round Neck T-Shirt",
    price: 899,
    image: "/women-round-neck-t-shirt.png",
    category: "casual-wear",
    subcategory: "round-neck-t-shirts",
    gender: "women",
  },
  {
    id: "23",
    name: "Oversized Hoodie",
    price: 1799,
    image: "/oversized-hoodie-fashion.png",
    category: "oversized-fit",
    subcategory: "hoodies",
    gender: "women",
  },
  {
    id: "24",
    name: "Bra",
    price: 799,
    image: "/lingerie-fashion-photography.png",
    category: "lingerie-innerwear",
    subcategory: "bra",
    gender: "women",
  },
  {
    id: "25",
    name: "Fashion Top",
    price: 1199,
    image: "/women-fashion-top.png",
    category: "western-wear",
    subcategory: "tops",
    gender: "women",
  },
  {
    id: "26",
    name: "Skinny Jeans",
    price: 1699,
    image: "/women-skinny-jeans-fashion.png",
    category: "western-wear",
    subcategory: "jeans-jeggings",
    gender: "women",
  },
  {
    id: "27",
    name: "Pleated Skirt",
    price: 1299,
    image: "/pleated-skirt-fashion.png",
    category: "western-wear",
    subcategory: "skirts-shorts",
    gender: "women",
  },
  {
    id: "28",
    name: "Casual Shoes",
    price: 1499,
    image: "/women-casual-shoes-fashion.png",
    category: "footwear",
    subcategory: "flats",
    gender: "women",
  },
  {
    id: "29",
    name: "Heeled Sandals",
    price: 1899,
    image: "/heeled-sandals-fashion.png",
    category: "footwear",
    subcategory: "heels",
    gender: "women",
  },
  {
    id: "30",
    name: "Stylish Handbag",
    price: 2499,
    image: "/stylish-handbag-shoot.png",
    category: "accessories",
    subcategory: "bags",
    gender: "women",
  },
];

// Category structure for filters
const categoryFilters = {
  "formal-wear": "Formal Wear",
  "casual-wear": "Casual Wear",
  "oversized-fit": "Oversized Fit",
  "lingerie-innerwear": "Lingerie & Innerwear",
  footwear: "Footwear",
  accessories: "Accessories",
  "western-wear": "Western Wear",
  "night-lounge-wear": "Night and Lounge Wear",
  "ethnic-festive": "Ethnic and Festive",
};

// Subcategory mappings
const subcategoryMappings = {
  "formal-wear": {
    shirts: "Shirts",
    pants: "Pants",
    suits: "Suits",
    blazers: "Blazers",
    skirts: "Skirts",
  },
  "casual-wear": {
    shirts: "Shirts",
    pants: "Pants",
    "t-shirts": "T-Shirts",
    "jeans-jeggings": "Jeans & Jeggings",
    tops: "Tops",
  },
  "oversized-fit": {
    shirts: "Shirts",
    pants: "Pants",
    "polo-t-shirts": "Polo T-Shirts",
    "round-neck-t-shirts": "Round Neck T-Shirts",
    hoodies: "Hoodies",
  },
  "lingerie-innerwear": {
    bra: "Bra",
    panties: "Panties",
    "night-wear": "Night Wear",
    "lounge-wear": "Lounge Wear",
    shapewear: "Shapewear",
  },
  footwear: {
    heels: "Heels",
    flats: "Flats",
    sandals: "Sandals",
    sneakers: "Sneakers",
    boots: "Boots",
  },
  accessories: {
    bags: "Bags",
    jewelry: "Jewelry",
    belts: "Belts",
    scarves: "Scarves",
    sunglasses: "Sunglasses",
  },
  "western-wear": {
    tops: "Tops",
    "jeans-jeggings": "Jeans & Jeggings",
    "skirts-shorts": "Skirts & Shorts",
    dresses: "Dresses",
    jumpsuits: "Jumpsuits",
  },
  "night-lounge-wear": {
    "night-suits": "Night Suits",
    pyjamas: "Pyjamas",
    shorts: "Shorts",
    robes: "Robes",
    "loungewear-sets": "Loungewear Sets",
  },
  "ethnic-festive": {
    kurtas: "Kurtas",
    "kurta-sets": "Kurta Sets",
    "ethnic-tops": "Ethnic Tops",
    "ethnic-dresses": "Ethnic Dresses",
    sarees: "Sarees",
    lehengas: "Lehengas",
  },
};

// Type for selected subcategories that includes the parent category
type SelectedSubcategory = {
  parent: string;
  key: string;
};

export default function WomenShopClient() {
  const [products, setProducts] = useState(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<
    SelectedSubcategory[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const loadLiveProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch("/api/products?gender=women&limit=120");
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
              gender: item.gender || "women",
            }))
          : [];

        if (liveProducts.length > 0) {
          setProducts(liveProducts);
          setFilteredProducts(liveProducts);
        }
      } catch (error) {
        console.error("Failed to load women products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadLiveProducts();
  }, []);

  // Filter products based on selected criteria
  useEffect(() => {
    let filtered = [...products];

    // Filter by gender (always women for this page)
    filtered = filtered.filter((product) => product.gender === "women");

    // Filter by price range
    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1],
    );

    // Apply category and subcategory filters
    if (selectedCategories.length > 0) {
      // Create a map to track which categories have selected subcategories
      const categoriesWithSelectedSubs = new Set<string>();
      selectedSubcategories.forEach((sub) => {
        categoriesWithSelectedSubs.add(sub.parent);
      });

      // Filter products based on categories and subcategories
      filtered = filtered.filter((product) => {
        // If the product's category is selected
        if (selectedCategories.includes(product.category)) {
          // If this category has selected subcategories
          if (categoriesWithSelectedSubs.has(product.category)) {
            // Check if the product's subcategory is one of the selected ones for this category
            return selectedSubcategories.some(
              (sub) =>
                sub.parent === product.category &&
                sub.key === product.subcategory,
            );
          }
          // If no subcategories are selected for this category, include all products from this category
          return true;
        }
        return false;
      });
    }

    // Sort products
    if (sortBy === "price-low-high") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high-low") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      // In a real app, you would sort by date
      filtered.sort((a, b) => Number.parseInt(b.id) - Number.parseInt(a.id));
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategories, selectedSubcategories, priceRange, sortBy]);

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    // Toggle the category selection
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelectedCategories);

    // If the category is being deselected, remove all its subcategories
    if (selectedCategories.includes(category)) {
      setSelectedSubcategories((prev) =>
        prev.filter((sub) => sub.parent !== category),
      );
    }

    // Toggle expansion when selecting/deselecting
    if (
      !expandedCategories.includes(category) &&
      !selectedCategories.includes(category)
    ) {
      setExpandedCategories((prev) => [...prev, category]);
    }
  };

  // Toggle subcategory selection
  const toggleSubcategory = (parent: string, key: string) => {
    const isSelected = isSubcategorySelected(parent, key);

    if (isSelected) {
      // Remove the subcategory
      setSelectedSubcategories((prev) =>
        prev.filter((sub) => !(sub.parent === parent && sub.key === key)),
      );
    } else {
      // Add the subcategory
      setSelectedSubcategories((prev) => [...prev, { parent, key }]);

      // Make sure the parent category is selected
      if (!selectedCategories.includes(parent)) {
        setSelectedCategories((prev) => [...prev, parent]);
      }
    }
  };

  // Helper function to check if a subcategory is selected
  const isSubcategorySelected = (parent: string, key: string) => {
    return selectedSubcategories.some(
      (sub) => sub.parent === parent && sub.key === key,
    );
  };

  // Get subcategory display name
  const getSubcategoryDisplayName = (parent: string, key: string) => {
    return (
      subcategoryMappings[parent as keyof typeof subcategoryMappings]?.[
        key as keyof (typeof subcategoryMappings)[keyof typeof subcategoryMappings]
      ] || key
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setPriceRange([0, 5000]);
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/diverse-products-still-life.png";
  };

  return (
    <div className="container px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex flex-wrap items-center text-sm">
          <li className="flex items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2 text-muted-foreground">/</span>
            <Link
              href="/shop"
              className="text-muted-foreground hover:text-foreground"
            >
              Shop
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="font-medium">Women</span>
          </li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Women's Collection</h1>
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
                {/* Categories */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryFilters).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox
                              id={`mobile-${key}`}
                              checked={selectedCategories.includes(key)}
                              onCheckedChange={() => toggleCategory(key)}
                            />
                            <label
                              htmlFor={`mobile-${key}`}
                              className="ml-2 text-sm cursor-pointer"
                            >
                              {value}
                            </label>
                          </div>
                          {Object.keys(
                            subcategoryMappings[
                              key as keyof typeof subcategoryMappings
                            ] || {},
                          ).length > 0 && (
                            <button
                              onClick={() => toggleCategoryExpansion(key)}
                              className="p-1 rounded-full hover:bg-muted"
                              aria-label={
                                expandedCategories.includes(key)
                                  ? "Collapse"
                                  : "Expand"
                              }
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  expandedCategories.includes(key)
                                    ? "transform rotate-180"
                                    : "",
                                )}
                              />
                            </button>
                          )}
                        </div>

                        {/* Subcategories */}
                        {expandedCategories.includes(key) && (
                          <div className="pl-6 space-y-1 border-l-2 border-muted ml-1.5">
                            {Object.entries(
                              subcategoryMappings[
                                key as keyof typeof subcategoryMappings
                              ] || {},
                            ).map(([subKey, subValue]) => (
                              <div key={subKey} className="flex items-center">
                                <Checkbox
                                  id={`mobile-${key}-${subKey}`}
                                  checked={isSubcategorySelected(key, subKey)}
                                  onCheckedChange={() =>
                                    toggleSubcategory(key, subKey)
                                  }
                                />
                                <label
                                  htmlFor={`mobile-${key}-${subKey}`}
                                  className="ml-2 text-sm cursor-pointer"
                                >
                                  {subValue}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

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

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                {Object.entries(categoryFilters).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={key}
                          checked={selectedCategories.includes(key)}
                          onCheckedChange={() => toggleCategory(key)}
                        />
                        <label
                          htmlFor={key}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {value}
                        </label>
                      </div>
                      {Object.keys(
                        subcategoryMappings[
                          key as keyof typeof subcategoryMappings
                        ] || {},
                      ).length > 0 && (
                        <button
                          onClick={() => toggleCategoryExpansion(key)}
                          className="p-1 rounded-full hover:bg-muted"
                          aria-label={
                            expandedCategories.includes(key)
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedCategories.includes(key)
                                ? "transform rotate-180"
                                : "",
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.includes(key) && (
                      <div className="pl-6 space-y-1 border-l-2 border-muted ml-1.5">
                        {Object.entries(
                          subcategoryMappings[
                            key as keyof typeof subcategoryMappings
                          ] || {},
                        ).map(([subKey, subValue]) => (
                          <div key={subKey} className="flex items-center">
                            <Checkbox
                              id={`${key}-${subKey}`}
                              checked={isSubcategorySelected(key, subKey)}
                              onCheckedChange={() =>
                                toggleSubcategory(key, subKey)
                              }
                            />
                            <label
                              htmlFor={`${key}-${subKey}`}
                              className="ml-2 text-sm cursor-pointer"
                            >
                              {subValue}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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

          {/* Active Filters */}
          {(selectedCategories.length > 0 ||
            selectedSubcategories.length > 0) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedCategories
                .filter(
                  (category) =>
                    !selectedSubcategories.some(
                      (sub) => sub.parent === category,
                    ),
                )
                .map((category) => (
                  <div
                    key={category}
                    className="flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                  >
                    <span>
                      {
                        categoryFilters[
                          category as keyof typeof categoryFilters
                        ]
                      }
                    </span>
                    <button
                      className="ml-2 focus:outline-none"
                      onClick={() => toggleCategory(category)}
                      aria-label={`Remove ${categoryFilters[category as keyof typeof categoryFilters]} filter`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              {selectedSubcategories.map((sub) => {
                const categoryName =
                  categoryFilters[sub.parent as keyof typeof categoryFilters];
                const subcategoryName = getSubcategoryDisplayName(
                  sub.parent,
                  sub.key,
                );

                return (
                  <div
                    key={`${sub.parent}-${sub.key}`}
                    className="flex items-center bg-muted-foreground/10 px-3 py-1 rounded-full text-sm"
                  >
                    <span>
                      {categoryName}: {subcategoryName}
                    </span>
                    <button
                      className="ml-2 focus:outline-none"
                      onClick={() => toggleSubcategory(sub.parent, sub.key)}
                      aria-label={`Remove ${subcategoryName} filter`}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}

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
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          onError={handleImageError}
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
                            sizes="128px"
                            onError={handleImageError}
                          />
                        </div>
                        <CardContent className="p-3 flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="mt-1 font-medium">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {
                              categoryFilters[
                                product.category as keyof typeof categoryFilters
                              ]
                            }
                            {product.subcategory && " - "}
                            {product.subcategory &&
                              getSubcategoryDisplayName(
                                product.category,
                                product.subcategory,
                              )}
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
