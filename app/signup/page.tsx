"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const { signUp } = useAuth();

  useEffect(() => {
    if (showCamera && videoRef.current && cameraStreamRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStreamRef.current;
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
      video.play().catch(() => {});
    }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      cameraStreamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setUserPhoto(imageData);
        setShowCamera(false);
        // Stop camera stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setUserPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzePhoto = async () => {
    if (!userPhoto) return;

    setPhotoLoading(true);
    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: userPhoto, email }),
      });

      if (response.ok) {
        // Photo analyzed and stored, proceed with signup
        await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      } else {
        setError("Failed to analyze photo. Please try again.");
      }
    } catch (err) {
      setError("Error processing photo. Please try again.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const userData = data.user;
      const tokens = data.tokens;

      // Store user data and tokens
      localStorage.setItem("pickfit_user", JSON.stringify(userData));
      if (tokens?.accessToken) {
        localStorage.setItem("accessToken", tokens.accessToken);
      }
      if (tokens?.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
      }

      // Redirect based on role
      if (userData.role === "admin") {
        router.push("/admin");
      } else if (userData.role === "seller") {
        router.push("/seller");
      } else if (userData.role === "delivery") {
        router.push("/delivery");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center py-10 px-4 min-h-[calc(100vh-14rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your details to create a new account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="customer">Customer - Shop & Try On</option>
                <option value="seller">Seller - Sell Products</option>
                <option value="delivery">
                  Delivery Partner - Deliver Orders
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {role === "customer" &&
                  "Browse products, virtual try-on, and shop"}
                {role === "seller" &&
                  "List products, manage inventory & orders"}
                {role === "delivery" && "Deliver orders and track shipments"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-base font-semibold mb-3 block">
                Add Your Photo (Optional)
              </Label>
              <p className="text-xs text-gray-600 mb-3">
                📸 Upload a photo for personalized fit recommendations & virtual
                try-on!
              </p>

              {userPhoto ? (
                <div className="relative mb-4">
                  <img
                    src={userPhoto}
                    alt="User photo"
                    className="w-full h-48 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : showCamera ? (
                <div className="mb-4 space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border-2 border-blue-300 bg-black"
                  />
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={240}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      📸 Capture
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCamera(false);
                        if (videoRef.current?.srcObject) {
                          (videoRef.current.srcObject as MediaStream)
                            .getTracks()
                            .forEach((t) => t.stop());
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" /> Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked as boolean)
                }
                required
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  terms and conditions
                </Link>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            {userPhoto ? (
              <Button
                onClick={analyzePhoto}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={photoLoading || isLoading}
              >
                {photoLoading ? "Analyzing photo..." : "Continue with Photo"}
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            )}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
