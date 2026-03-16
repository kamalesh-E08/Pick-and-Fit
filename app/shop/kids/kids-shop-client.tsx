"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mock product data (simplified version for kids' products)
const mockProducts = [
  {
    id: 47,
    name: "Boys Cotton T-Shirt",
    price: 499,
    image: "/boys-cotton-t-shirt-fashion.png",
    category: "boy",
    subcategory: "clothing",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: 48,
    name: "Boys Jeans",
    price: 799,
    image: "/boys-jeans-fashion.png",
    category: "boy",
    subcategory: "clothing",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: 49,
    name: "Boys Cotton Vest",
    price: 299,
    image: "/boys-cotton-vest-innerwear.png",
    category: "boy",
    subcategory: "innerwear-sleepwear",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: 50,
    name: "Boys Sports Shoes",
    price: 999,
    image: "/boys-sports-shoes-fashion.png",
    category: "boy",
    subcategory: "footwear",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: 51,
    name: "Boys Kurta Set",
    price: 1299,
    image: "/boys-kurta-set-fashion.png",
    category: "boy",
    subcategory: "festive-ethnic",
    gender: "kids",
    kidGender: "boy",
  },
  {
    id: 52,
    name: "Girls Floral Dress",
    price: 799,
    image: "/placeholder-q6gbs.png",
    category: "girl",
    subcategory: "clothing",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: 53,
    name: "Girls Cotton T-Shirt",
    price: 499,
    image: "/placeholder-7y8j9.png",
    category: "girl",
    subcategory: "clothing",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: 54,
    name: "Girls Nightwear Set",
    price: 699,
    image: "/girls-pajama-fashion.png",
    category: "girl",
    subcategory: "innerwear-sleepwear",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: 55,
    name: "Girls Sandals",
    price: 599,
    image: "/placeholder-is7ni.png",
    category: "girl",
    subcategory: "footwear",
    gender: "kids",
    kidGender: "girl",
  },
  {
    id: 56,
    name: "Girls Lehenga",
    price: 1499,
    image: "/girls-lehenga-fashion.png",
    category: "girl",
    subcategory: "festive-ethnic",
    gender: "kids",
    kidGender: "girl",
  },
];

export default function KidsShopClient() {
  const [products, setProducts] = useState(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<
    SelectedSubcategory[]
  >([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadLiveProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch("/api/products?gender=kids&limit=120");
        if (!response.ok) return;

        const data = await response.json();
        const liveProducts = Array.isArray(data?.products)
          ? data.products.map((item: any) => {
              const derivedKidGender =
                item.category === "boy" || item.category === "girl"
                  ? item.category
                  : item.kidGender || "";

              return {
                id: String(item.productId || item._id),
                name: item.name,
                price: Number(item.price || 0),
                image: item.mainImage || item.images?.[0] || "/placeholder.svg",
                category: item.category || "",
                subcategory: item.subcategory || "",
                gender: item.gender || "kids",
                kidGender: derivedKidGender,
              };
            })
          : [];

        if (liveProducts.length > 0) {
          setProducts(liveProducts);
          setFilteredProducts(liveProducts);
        }
      } catch (error) {
        console.error("Failed to load kids products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadLiveProducts();
  }, []);

  // Category structure for filters
  const categoryFilters = {
    boy: "Boy",
    girl: "Girl",
  };

  // Subcategory mappings
  const subcategoryMappings = {
    boy: {
      clothing: "Clothing",
      "innerwear-sleepwear": "Innerwear & Sleepwear",
      "toys-babycare": "Toys & Babycare",
      footwear: "Footwear",
      "festive-ethnic": "Festive & Ethnic Wear",
    },
    girl: {
      clothing: "Clothing",
      "innerwear-sleepwear": "Innerwear & Sleepwear",
      "toys-babycare": "Toys & Babycare",
      footwear: "Footwear",
      "festive-ethnic": "Festive & Ethnic Wear",
    },
  };

  // Type for selected subcategory that includes parent category
  type SelectedSubcategory = {
    category: string;
    subcategory: string;
  };

  // Filter products based on selected criteria
  useEffect(() => {
    let filtered = [...products];

    // Filter by gender (always kids for this page)
    filtered = filtered.filter((product) => product.gender === "kids");

    // Apply category and subcategory filters
    if (selectedCategories.length > 0 || selectedSubcategories.length > 0) {
      filtered = filtered.filter((product) => {
        // Check if product's category is directly selected
        const isCategorySelected = selectedCategories.includes(
          product.kidGender || "",
        );

        // Check if any subcategory of this product's category is selected
        const hasSelectedSubcategories = selectedSubcategories.some(
          (item) => item.category === product.kidGender,
        );

        // If category is selected but no subcategories for it are selected, include all products from this category
        if (isCategorySelected && !hasSelectedSubcategories) {
          return true;
        }

        // If subcategories are selected for this category, check if product matches any of them
        if (hasSelectedSubcategories) {
          return selectedSubcategories.some(
            (item) =>
              item.category === product.kidGender &&
              item.subcategory === product.subcategory,
          );
        }

        return false;
      });
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
      filtered.sort((a, b) => String(b.id).localeCompare(String(a.id)));
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategories, selectedSubcategories, priceRange, sortBy]);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    // Toggle category selection
    const isSelected = selectedCategories.includes(category);

    if (isSelected) {
      // If deselecting, remove category and its subcategories
      setSelectedCategories((prev) => prev.filter((c) => c !== category));
      setSelectedSubcategories((prev) =>
        prev.filter((item) => item.category !== category),
      );
      setExpandedCategories((prev) => prev.filter((c) => c !== category));
    } else {
      // If selecting, add category and expand it
      setSelectedCategories((prev) => [...prev, category]);
      setExpandedCategories((prev) => [...prev, category]);
    }
  };

  // Toggle subcategory selection
  const toggleSubcategory = (category: string, subcategory: string) => {
    const selectedItem = { category, subcategory };
    const isSelected = isSubcategorySelected(category, subcategory);

    if (isSelected) {
      // Remove if already selected
      setSelectedSubcategories((prev) =>
        prev.filter(
          (item) =>
            !(item.category === category && item.subcategory === subcategory),
        ),
      );
    } else {
      // Add if not selected
      setSelectedSubcategories((prev) => [...prev, selectedItem]);

      // Also ensure the parent category is selected
      if (!selectedCategories.includes(category)) {
        setSelectedCategories((prev) => [...prev, category]);
      }
    }
  };

  // Helper function to check if a subcategory is selected
  const isSubcategorySelected = (category: string, subcategory: string) => {
    return selectedSubcategories.some(
      (item) => item.category === category && item.subcategory === subcategory,
    );
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setPriceRange([0, 2000]);
    setExpandedCategories([]);
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
            <span className="font-medium">Kids</span>
          </li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Kids' Collection</h1>
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
                  <h3 className="text-sm font-semibold mb-3">Gender</h3>
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
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleCategoryExpansion(key);
                            }}
                            className="p-1 rounded-full hover:bg-muted"
                          >
                            {expandedCategories.includes(key) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Subcategories */}
                        {expandedCategories.includes(key) && (
                          <div className="pl-6 space-y-2 border-l-2 border-muted ml-2">
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
                      defaultValue={[0, 2000]}
                      max={2000}
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
              <h3 className="text-sm font-semibold mb-3">Gender</h3>
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
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCategoryExpansion(key);
                        }}
                        className="p-1 rounded-full hover:bg-muted"
                      >
                        {expandedCategories.includes(key) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.includes(key) && (
                      <div className="pl-6 space-y-2 border-l-2 border-muted ml-2">
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
                  defaultValue={[0, 2000]}
                  max={2000}
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
              {/* Show categories that don't have any selected subcategories */}
              {selectedCategories
                .filter(
                  (category) =>
                    !selectedSubcategories.some(
                      (item) => item.category === category,
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

              {/* Show selected subcategories with their parent category name */}
              {selectedSubcategories.map(({ category, subcategory }) => {
                const categoryName =
                  categoryFilters[category as keyof typeof categoryFilters];
                const subcategoryName =
                  subcategoryMappings[
                    category as keyof typeof subcategoryMappings
                  ]?.[
                    subcategory as keyof (typeof subcategoryMappings)[keyof typeof subcategoryMappings]
                  ];

                return (
                  <div
                    key={`${category}-${subcategory}`}
                    className="flex items-center bg-muted-foreground/10 px-3 py-1 rounded-full text-sm"
                  >
                    <span>
                      {categoryName}: {subcategoryName}
                    </span>
                    <button
                      className="ml-2 focus:outline-none"
                      onClick={() => toggleSubcategory(category, subcategory)}
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
                                product.kidGender as keyof typeof categoryFilters
                              ]
                            }{" "}
                            -{" "}
                            {subcategoryMappings[
                              product.kidGender as keyof typeof subcategoryMappings
                            ]?.[
                              product.subcategory as keyof (typeof subcategoryMappings)[keyof typeof subcategoryMappings]
                            ] || product.subcategory}
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
