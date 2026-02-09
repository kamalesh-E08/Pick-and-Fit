"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, X } from "lucide-react";

interface Product {
  _id: string;
  productId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  gender?: string;
  brand?: string;
  images?: string[];
  mainImage?: string;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  material?: string;
  careInstructions?: string[];
  features?: string[];
  stock: number;
  isAvailable: boolean;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface ProductFormState {
  id?: string;
  productId: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  category: string;
  subcategory: string;
  gender: string;
  brand: string;
  mainImage: string;
  images: string;
  sizes: string;
  colors: string;
  tags: string;
  stock: string;
  isAvailable: boolean;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

const emptyForm: ProductFormState = {
  productId: "",
  name: "",
  description: "",
  shortDescription: "",
  price: "",
  originalPrice: "",
  category: "",
  subcategory: "",
  gender: "men",
  brand: "",
  mainImage: "",
  images: "",
  sizes: "",
  colors: "",
  tags: "",
  stock: "",
  isAvailable: true,
  slug: "",
  metaTitle: "",
  metaDescription: "",
};

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signin");
      return;
    }
    fetchProducts();
  }, [pagination.page, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/seller/api/products?page=${pagination.page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch seller products:", error);
    } finally {
      setLoading(false);
    }
  };

  const slugFromName = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const parsedImages = useMemo(
    () =>
      form.images
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.images],
  );

  const parsedSizes = useMemo(
    () =>
      form.sizes
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.sizes],
  );

  const parsedColors = useMemo(
    () =>
      form.colors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.colors],
  );

  const parsedTags = useMemo(
    () =>
      form.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.tags],
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const priceValue = Number(form.price);
    const originalPriceValue = Number(form.originalPrice || form.price);
    const stockValue = Number(form.stock);

    if (!form.productId.trim()) nextErrors.productId = "Product ID is required";
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.description.trim())
      nextErrors.description = "Description is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    if (!form.gender.trim()) nextErrors.gender = "Gender is required";
    if (!form.mainImage.trim()) nextErrors.mainImage = "Main image is required";
    if (!form.slug.trim()) nextErrors.slug = "Slug is required";

    if (!form.price || Number.isNaN(priceValue) || priceValue <= 0) {
      nextErrors.price = "Price must be a positive number";
    }
    if (
      !form.originalPrice ||
      Number.isNaN(originalPriceValue) ||
      originalPriceValue < priceValue
    ) {
      nextErrors.originalPrice =
        "Original price must be greater than or equal to price";
    }
    if (!form.stock || Number.isNaN(stockValue) || stockValue < 0) {
      nextErrors.stock = "Stock must be 0 or greater";
    }
    if (parsedImages.length === 0) {
      nextErrors.images = "At least one image URL is required";
    }
    if (parsedSizes.length === 0) {
      nextErrors.sizes = "At least one size is required";
    }
    if (parsedColors.length === 0) {
      nextErrors.colors = "At least one color is required";
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      nextErrors.slug =
        "Slug can only include lowercase letters, numbers, and hyphens";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setErrors({});
    setIsEditing(false);
    setSlugTouched(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setForm({
      id: product._id,
      productId: product.productId,
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: product.price?.toString() || "",
      originalPrice: product.originalPrice?.toString() || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      gender: product.gender || "men",
      brand: product.brand || "",
      mainImage: product.mainImage || "",
      images: product.images?.join(", ") || "",
      sizes: product.sizes?.join(", ") || "",
      colors: product.colors?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      stock: product.stock?.toString() || "",
      isAvailable: product.isAvailable ?? true,
      slug: product.slug || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
    });
    setErrors({});
    setIsEditing(true);
    setSlugTouched(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/seller/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId }),
      });

      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem("accessToken");

      const payload = {
        productId: form.productId.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice || form.price),
        category: form.category.trim(),
        subcategory: form.subcategory.trim() || undefined,
        gender: form.gender.trim(),
        brand: form.brand.trim() || undefined,
        mainImage: form.mainImage.trim(),
        images: parsedImages,
        sizes: parsedSizes,
        colors: parsedColors,
        tags: parsedTags,
        stock: Number(form.stock),
        isAvailable: form.isAvailable,
        slug: form.slug.trim(),
        metaTitle: form.metaTitle.trim() || undefined,
        metaDescription: form.metaDescription.trim() || undefined,
      };

      const response = await fetch("/seller/api/products", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(isEditing ? { id: form.id, ...payload } : payload),
      });

      if (response.ok) {
        setIsModalOpen(false);
        await fetchProducts();
      } else {
        const errorData = await response.json();
        if (errorData.fields) {
          setErrors(errorData.fields);
        } else {
          setErrors({ form: errorData.error || "Failed to save product" });
        }
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      setErrors({ form: "Failed to save product" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: keyof ProductFormState, value: string) => {
    if (key === "slug") {
      setSlugTouched(true);
    }
    if (key === "name" && !slugTouched && !isEditing) {
      setForm((prev) => ({
        ...prev,
        [key]: value,
        slug: slugFromName(value),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/seller">
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {product.category}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold">₹{product.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span
                        className={`font-semibold ${
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: Math.max(1, pagination.page - 1),
                  })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: Math.min(pagination.pages, pagination.page + 1),
                  })
                }
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Product" : "Create Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              {errors.form && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {errors.form}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Product ID"
                  required
                  value={form.productId}
                  error={errors.productId}
                  disabled={isEditing}
                  onChange={(value) => handleFieldChange("productId", value)}
                />
                <FormField
                  label="Name"
                  required
                  value={form.name}
                  error={errors.name}
                  onChange={(value) => handleFieldChange("name", value)}
                />
                <FormField
                  label="Category"
                  required
                  value={form.category}
                  error={errors.category}
                  onChange={(value) => handleFieldChange("category", value)}
                />
                <FormField
                  label="Subcategory"
                  value={form.subcategory}
                  onChange={(value) => handleFieldChange("subcategory", value)}
                />
                <FormSelect
                  label="Gender"
                  required
                  value={form.gender}
                  error={errors.gender}
                  onChange={(value) => handleFieldChange("gender", value)}
                  options={["men", "women", "kids", "unisex", "beauty"]}
                />
                <FormField
                  label="Brand"
                  value={form.brand}
                  onChange={(value) => handleFieldChange("brand", value)}
                />
                <FormField
                  label="Price"
                  required
                  type="number"
                  value={form.price}
                  error={errors.price}
                  onChange={(value) => handleFieldChange("price", value)}
                />
                <FormField
                  label="Original Price"
                  required
                  type="number"
                  value={form.originalPrice}
                  error={errors.originalPrice}
                  onChange={(value) =>
                    handleFieldChange("originalPrice", value)
                  }
                />
                <FormField
                  label="Stock"
                  required
                  type="number"
                  value={form.stock}
                  error={errors.stock}
                  onChange={(value) => handleFieldChange("stock", value)}
                />
                <FormSelect
                  label="Availability"
                  value={form.isAvailable ? "true" : "false"}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      isAvailable: value === "true",
                    }))
                  }
                  options={["true", "false"]}
                  optionLabels={{ true: "Available", false: "Unavailable" }}
                />
                <FormField
                  label="Main Image URL"
                  required
                  value={form.mainImage}
                  error={errors.mainImage}
                  onChange={(value) => handleFieldChange("mainImage", value)}
                />
                <FormField
                  label="Images (comma separated)"
                  required
                  value={form.images}
                  error={errors.images}
                  onChange={(value) => handleFieldChange("images", value)}
                />
                <FormField
                  label="Sizes (comma separated)"
                  required
                  value={form.sizes}
                  error={errors.sizes}
                  onChange={(value) => handleFieldChange("sizes", value)}
                />
                <FormField
                  label="Colors (comma separated)"
                  required
                  value={form.colors}
                  error={errors.colors}
                  onChange={(value) => handleFieldChange("colors", value)}
                />
                <FormField
                  label="Tags (comma separated)"
                  value={form.tags}
                  onChange={(value) => handleFieldChange("tags", value)}
                />
                <div className="md:col-span-2 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Image previews
                    </p>
                    {parsedImages.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {parsedImages.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="flex h-24 items-center justify-center overflow-hidden rounded-lg border bg-white"
                          >
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        Add image URLs to see previews.
                      </p>
                    )}
                  </div>
                  <ChipGroup label="Sizes" items={parsedSizes} />
                  <ChipGroup label="Colors" items={parsedColors} />
                  <ChipGroup
                    label="Tags"
                    items={parsedTags}
                    emptyLabel="No tags yet"
                  />
                </div>
                <FormField
                  label="Slug"
                  required
                  value={form.slug}
                  error={errors.slug}
                  onChange={(value) => handleFieldChange("slug", value)}
                />
                <FormField
                  label="Meta Title"
                  value={form.metaTitle}
                  onChange={(value) => handleFieldChange("metaTitle", value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormTextArea
                  label="Description"
                  required
                  value={form.description}
                  error={errors.description}
                  onChange={(value) => handleFieldChange("description", value)}
                />
                <FormTextArea
                  label="Short Description"
                  value={form.shortDescription}
                  onChange={(value) =>
                    handleFieldChange("shortDescription", value)
                  }
                />
              </div>
              <div className="mt-4">
                <FormTextArea
                  label="Meta Description"
                  value={form.metaDescription}
                  onChange={(value) =>
                    handleFieldChange("metaDescription", value)
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100" : "bg-white"}`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  error,
  required,
  options,
  optionLabels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  options: string[];
  optionLabels?: Record<string, string>;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function FormTextArea({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function ChipGroup({
  label,
  items,
  emptyLabel = "No items",
}: {
  label: string;
  items: string[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={`${label}-${item}`}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}
