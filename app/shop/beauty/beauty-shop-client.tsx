"use client";

import { useState, useEffect } from "react";
import { beautyProducts } from "@/lib/product-data";
import { ProductCard } from "@/components/product-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BeautyShopClient() {
  const normalizeLabel = (value: string) =>
    value
      .replace(/[-_]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const [sourceProducts, setSourceProducts] = useState(beautyProducts);
  const [products, setProducts] = useState(beautyProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    [],
  );
  const [sortOption, setSortOption] = useState("featured");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Define the category hierarchy
  const categoryHierarchy = {
    Skincare: [
      "Cleansers",
      "Moisturizers",
      "Serums",
      "Sunscreen",
      "Eye Cream",
      "Lip Balm",
    ],
    Makeup: [
      "Lipstick",
      "Lip Gloss",
      "Lip Balm",
      "Nail Care",
      "Mascara",
      "Eyeliner & Kajals",
      "Foundation",
    ],
    Haircare: [
      "Shampoo",
      "Conditioner",
      "Hair Oil",
      "Hair Color",
      "Hair Styling",
    ],
    Fragrances: ["Perfumes", "Deodorants"],
    "Bath and Body": ["Face Wash", "Body Wash", "Body Scrub"],
    "Men's Grooming": [
      "Shaving Essentials",
      "Beard Care",
      "Hair Wax",
      "Deodorants",
    ],
  };

  // Get all main categories
  const mainCategories = Object.keys(categoryHierarchy);

  useEffect(() => {
    const loadLiveProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch("/api/products?gender=beauty&limit=120");
        if (!response.ok) return;

        const data = await response.json();
        const liveProducts = Array.isArray(data?.products)
          ? data.products.map((item: any) => ({
              id: String(item.productId || item._id),
              name: item.name,
              price: Number(item.price || 0),
              originalPrice: Number(item.originalPrice || item.price || 0),
              image: item.mainImage || item.images?.[0] || "/placeholder.svg",
              rating: Number(item.rating || 4),
              reviewCount: Number(item.reviewCount || 0),
              tags: Array.isArray(item.tags) ? item.tags : [],
              category: normalizeLabel(item.category || "Beauty"),
              subCategory: normalizeLabel(
                item.subcategory || item.category || "General",
              ),
              isNew: false,
              isBestSeller: false,
            }))
          : [];

        if (liveProducts.length > 0) {
          setSourceProducts(liveProducts as any);
          setProducts(liveProducts as any);
        }
      } catch (error) {
        console.error("Failed to load beauty products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadLiveProducts();
  }, []);

  useEffect(() => {
    let filteredProducts = [...sourceProducts];

    // Filter by price
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1],
    );

    // Filter by category
    if (selectedCategories.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        selectedCategories.includes(product.category),
      );
    }

    // Filter by subcategory
    if (selectedSubCategories.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        selectedSubCategories.includes(product.subCategory),
      );
    }

    // Sort products
    switch (sortOption) {
      case "price-low-high":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filteredProducts.sort((a, b) =>
          a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1,
        );
        break;
      case "best-selling":
        filteredProducts.sort((a, b) =>
          a.isBestSeller === b.isBestSeller ? 0 : a.isBestSeller ? -1 : 1,
        );
        break;
      default:
        // 'featured' - no specific sorting
        break;
    }

    setProducts(filteredProducts);
  }, [
    priceRange,
    selectedCategories,
    selectedSubCategories,
    sortOption,
    sourceProducts,
  ]);

  const handleCategoryChange = (category: string) => {
    const isCurrentlySelected = selectedCategories.includes(category);

    // Update selected categories
    const newSelectedCategories = isCurrentlySelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelectedCategories);

    // Auto-expand dropdown when category is selected, collapse when deselected
    if (!isCurrentlySelected) {
      // Category is being selected - add to expanded categories if not already there
      if (!expandedCategories.includes(category)) {
        setExpandedCategories([...expandedCategories, category]);
      }
    } else {
      // Category is being deselected - remove from expanded categories
      setExpandedCategories(expandedCategories.filter((c) => c !== category));

      // If a category is deselected, also deselect its subcategories
      const subcategoriesToRemove = categoryHierarchy[category] || [];
      setSelectedSubCategories((prev) =>
        prev.filter((subCat) => !subcategoriesToRemove.includes(subCat)),
      );
    }
  };

  const handleSubCategoryChange = (subCategory: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(subCategory)
        ? prev.filter((c) => c !== subCategory)
        : [...prev, subCategory],
    );
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Beauty Products</h1>
        <p className="text-gray-600">
          {isLoadingProducts
            ? "Loading products..."
            : `${products.length} products available`}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters sidebar - no card/border */}
        <div className="w-full md:w-1/4">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubCategories([]);
                  setPriceRange([0, 5000]);
                  setSortOption("featured");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Categories</h3>
            <div className="space-y-2">
              {mainCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </Label>
                    </div>
                    <button
                      onClick={() => toggleCategoryExpand(category)}
                      className="flex items-center"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedCategories.includes(category)
                            ? "transform rotate-180"
                            : "",
                        )}
                      />
                    </button>
                  </div>

                  {/* Only show subcategories if the category is expanded */}
                  {expandedCategories.includes(category) &&
                    categoryHierarchy[category] && (
                      <div className="ml-6 space-y-2 mt-2">
                        {categoryHierarchy[category].map((subCategory) => (
                          <div
                            key={subCategory}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`subcategory-${subCategory}`}
                              checked={selectedSubCategories.includes(
                                subCategory,
                              )}
                              onCheckedChange={() =>
                                handleSubCategoryChange(subCategory)
                              }
                            />
                            <Label
                              htmlFor={`subcategory-${subCategory}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {subCategory}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Price Range</h3>
            <Slider
              defaultValue={[0, 5000]}
              max={5000}
              step={100}
              value={priceRange}
              onValueChange={handlePriceChange}
              className="mb-2"
            />
            <div className="flex justify-between text-sm">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Products section */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="ml-2 border rounded-md px-3 py-1 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="best-selling">Best Selling</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="p-1 border rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                  <line x1="8" y1="16" x2="16" y2="16"></line>
                  <line x1="8" y1="8" x2="16" y2="8"></line>
                </svg>
              </button>
              <button className="p-1 border rounded bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">
                No products match your filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubCategories([]);
                  setPriceRange([0, 5000]);
                  setSortOption("featured");
                }}
                className="mt-4 text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image}
                  rating={product.rating}
                  reviewCount={product.reviewCount || 0}
                  tags={product.tags || []}
                  category={product.category}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
