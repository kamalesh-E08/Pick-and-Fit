"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Heart,
  Palette,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation Schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Invalid phone number",
    )
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
});

const bodyMetricsSchema = z.object({
  height: z
    .number()
    .min(100, "Height must be at least 100cm")
    .max(250)
    .optional()
    .or(z.literal(null)),
  weight: z
    .number()
    .min(30, "Weight must be at least 30kg")
    .max(250)
    .optional()
    .or(z.literal(null)),
  bodyType: z.string().optional(),
  skinTone: z.string().optional(),
  preferredFitProfile: z.string().optional(),
});

const preferencesSchema = z.object({
  favoriteCategories: z.string().optional(),
  favoriteColors: z.string().optional(),
  favoriteBrands: z.string().optional(),
  sizePreferences: z.string().optional(),
  occasion: z.string().optional(),
});

const fullProfileSchema = z.object({
  name: profileFormSchema.shape.name,
  phone: profileFormSchema.shape.phone,
  address: profileFormSchema.shape.address,
  city: profileFormSchema.shape.city,
  state: profileFormSchema.shape.state,
  zipCode: profileFormSchema.shape.zipCode,
  country: profileFormSchema.shape.country,
  bodyMetrics: bodyMetricsSchema.optional(),
  preferences: preferencesSchema.optional(),
});

type ProfileFormValues = z.infer<typeof fullProfileSchema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(fullProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      bodyMetrics: {
        height: undefined,
        weight: undefined,
        bodyType: "",
        skinTone: "",
        preferredFitProfile: "",
      },
      preferences: {
        favoriteCategories: "",
        favoriteColors: "",
        favoriteBrands: "",
        sizePreferences: "",
        occasion: "",
      },
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/signin?redirect=/profile/edit");
      return;
    }

    // Load user data
    const loadUserData = async () => {
      if (!user.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);

          // Populate form with user data
          if (data.user) {
            form.reset({
              name: data.user.name || "",
              phone: data.user.phone || "",
              address: data.user.addresses?.[0]?.street || "",
              city: data.user.addresses?.[0]?.city || "",
              state: data.user.addresses?.[0]?.state || "",
              zipCode: data.user.addresses?.[0]?.zipCode || "",
              country: data.user.addresses?.[0]?.country || "",
              bodyMetrics: {
                height: data.user.bodyMetrics?.height || undefined,
                weight: data.user.bodyMetrics?.weight || undefined,
                bodyType: data.user.bodyMetrics?.bodyType || "",
                skinTone: data.user.bodyMetrics?.skinTone || "",
                preferredFitProfile:
                  data.user.bodyMetrics?.preferredFitProfile || "",
              },
              preferences: {
                favoriteCategories:
                  data.user.preferences?.favoriteCategories?.join(", ") || "",
                favoriteColors:
                  data.user.preferences?.favoriteColors?.join(", ") || "",
                favoriteBrands:
                  data.user.preferences?.favoriteBrands?.join(", ") || "",
                sizePreferences: data.user.preferences?.sizePreferences || "",
                occasion: data.user.preferences?.occasion || "",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, router, form]);

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) {
      toast.error("User ID not found");
      return;
    }

    try {
      setIsSaving(true);
      setSuccessMessage("");

      // Prepare update data
      const updateData: any = {
        name: values.name,
        phone: values.phone || undefined,
        addresses: values.address
          ? [
              {
                street: values.address,
                city: values.city || "",
                state: values.state || "",
                zipCode: values.zipCode || "",
                country: values.country || "",
                isDefault: true,
              },
            ]
          : undefined,
        bodyMetrics: values.bodyMetrics
          ? {
              height: values.bodyMetrics.height || null,
              weight: values.bodyMetrics.weight || null,
              bodyType: values.bodyMetrics.bodyType || "",
              skinTone: values.bodyMetrics.skinTone || "",
              preferredFitProfile: values.bodyMetrics.preferredFitProfile || "",
            }
          : undefined,
        preferences: values.preferences
          ? {
              favoriteCategories:
                values.preferences.favoriteCategories
                  ?.split(",")
                  .map((c) => c.trim())
                  .filter(Boolean) || [],
              favoriteColors:
                values.preferences.favoriteColors
                  ?.split(",")
                  .map((c) => c.trim())
                  .filter(Boolean) || [],
              favoriteBrands:
                values.preferences.favoriteBrands
                  ?.split(",")
                  .map((c) => c.trim())
                  .filter(Boolean) || [],
              sizePreferences: values.preferences.sizePreferences || "",
              occasion: values.preferences.occasion || "",
            }
          : undefined,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const result = await response.json();
      setUserData(result.user);
      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated!");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger
                  value="personal"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="body" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Body Metrics</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="flex items-center gap-2"
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your basic contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email (Read-only) */}
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="bg-slate-100"
                        />
                      </FormControl>
                      <FormDescription>Email cannot be changed</FormDescription>
                    </FormItem>

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Phone className="h-4 w-4 inline mr-2" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormDescription>
                            Format: +1 (555) 123-4567
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address Section */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address
                      </h3>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="San Francisco" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input placeholder="California" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="94102" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="United States" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Body Metrics Tab */}
              <TabsContent value="body">
                <Card>
                  <CardHeader>
                    <CardTitle>Body Metrics</CardTitle>
                    <CardDescription>
                      Help us provide better fit recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bodyMetrics.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="170"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Height in centimeters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bodyMetrics.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="70"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Weight in kilograms
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bodyMetrics.bodyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Type</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your body type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pear">Pear Shape</SelectItem>
                              <SelectItem value="apple">Apple Shape</SelectItem>
                              <SelectItem value="hourglass">
                                Hourglass
                              </SelectItem>
                              <SelectItem value="rectangle">
                                Rectangle
                              </SelectItem>
                              <SelectItem value="triangle">Triangle</SelectItem>
                              <SelectItem value="inverted-triangle">
                                Inverted Triangle
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bodyMetrics.skinTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skin Tone</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your skin tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="olive">Olive</SelectItem>
                              <SelectItem value="tan">Tan</SelectItem>
                              <SelectItem value="deep">Deep</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bodyMetrics.preferredFitProfile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Fit</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your preferred fit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="slim">Slim Fit</SelectItem>
                              <SelectItem value="regular">
                                Regular Fit
                              </SelectItem>
                              <SelectItem value="loose">Loose Fit</SelectItem>
                              <SelectItem value="oversized">
                                Oversized
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Style Preferences</CardTitle>
                    <CardDescription>
                      Help us recommend products you'll love
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="preferences.favoriteCategories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favorite Categories</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Dresses, Casual Wear, Formal Wear (comma separated)"
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter categories separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.favoriteColors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favorite Colors</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Blue, Black, Pastel (comma separated)"
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter colors separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.favoriteBrands"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favorite Brands</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Nike, Zara, H&M (comma separated)"
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter brands separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.sizePreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size Preference</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your usual size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="xs">
                                Extra Small (XS)
                              </SelectItem>
                              <SelectItem value="s">Small (S)</SelectItem>
                              <SelectItem value="m">Medium (M)</SelectItem>
                              <SelectItem value="l">Large (L)</SelectItem>
                              <SelectItem value="xl">
                                Extra Large (XL)
                              </SelectItem>
                              <SelectItem value="xxl">
                                2X Large (XXL)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.occasion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Occasion</FormLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select preferred occasion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="sports">
                                Sports & Fitness
                              </SelectItem>
                              <SelectItem value="evening">
                                Evening Wear
                              </SelectItem>
                              <SelectItem value="beach">
                                Beach & Resort
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
