"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  LogOut,
  ShoppingBag,
  Heart,
  Ruler,
  Palette,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useBodyMetrics } from "@/context/body-metrics-context";

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const { metrics, isLoading: metricsLoading, fetchMetrics } = useBodyMetrics();

  const profileFields = [
    {
      label: "Height",
      filled: !!metrics?.estimatedHeight,
    },
    {
      label: "Body type",
      filled: !!metrics?.estimatedBodyType,
    },
    {
      label: "Skin tone",
      filled: !!metrics?.skinTone,
    },
    {
      label: "Waist size",
      filled: !!metrics?.estimatedWaistSize,
    },
    {
      label: "Bust size",
      filled: !!metrics?.estimatedBustSize,
    },
  ];

  const completedItems = profileFields.filter((field) => field.filled).length;
  const completionPercent = Math.round(
    (completedItems / profileFields.length) * 100,
  );
  const missingFields = profileFields
    .filter((field) => !field.filled)
    .map((field) => field.label);

  useEffect(() => {
    if (user?.email && !metrics && !metricsLoading) {
      fetchMetrics(user.email);
    }
  }, [user?.email, metrics, metricsLoading, fetchMetrics]);

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-10 px-4 min-h-[calc(100vh-14rem)]">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-2">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-14 bg-muted animate-pulse rounded" />
            <div className="h-14 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex items-center justify-center py-10 px-4 min-h-[calc(100vh-14rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            <CardDescription>
              Please sign in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => router.push("/signin")}>
              Sign in
            </Button>
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const progressRadius = 38;
  const progressStroke = 6;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset =
    progressCircumference - (completionPercent / 100) * progressCircumference;

  return (
    <div className="container py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details and preferences.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/profile/edit">Edit Profile</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card/90 p-5 mb-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative h-28 w-28 rounded-full bg-muted/70 p-3">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="rgba(148,163,184,0.25)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#ec4899"
                strokeWidth="6"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              A more complete profile helps AI suggestions, fit predictions, and
              curated recommendations.
            </p>
            <div className="flex flex-wrap gap-2">
              {missingFields.slice(0, 3).map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  {field}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-foreground">
                {completionPercent}% complete
              </p>
              <p className="text-sm text-muted-foreground">
                Fill out your profile to unlock better recommendations.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/profile/edit">Complete your profile</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your basic account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Address</p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Track your recent orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Start shopping
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
              <CardDescription>Items you saved for later.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your wishlist is empty.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/wishlist">
                  <Heart className="h-4 w-4 mr-2" /> View wishlist
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fit & Body Profile</CardTitle>
            <CardDescription>
              Recommended fields that improve fit and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height</p>
                <p className="font-medium">
                  {metrics?.estimatedHeight || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Body Type</p>
                <p className="font-medium capitalize">
                  {metrics?.estimatedBodyType || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skin Tone</p>
                <p className="font-medium">
                  {metrics?.skinTone || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waist Size</p>
                <p className="font-medium">
                  {metrics?.estimatedWaistSize || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bust Size</p>
                <p className="font-medium">
                  {metrics?.estimatedBustSize || "Not added"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-medium">
                  {metrics?.confidence
                    ? `${Math.round(metrics.confidence * 100)}%`
                    : "Not available"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            {metrics?.recommendations?.length ? (
              <div>
                <p className="text-sm font-medium">Fit Tips</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {metrics.recommendations.slice(0, 3).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a photo during signup to unlock fit insights.
              </p>
            )}
            <Button variant="outline" asChild>
              <Link href="/signup">Update fit profile</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
            <CardDescription>
              Recommended fields to personalize product picks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Favorite Categories
                </p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favorite Colors</p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Size Preferences
                </p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favorite Brands</p>
                <p className="font-medium text-muted-foreground">Not added</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/signup">Update preferences</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
