import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface PhotoAnalysisRequest {
  photo: string; // Base64 image data
  email: string;
}

interface BodyMetrics {
  detectedFace: boolean;
  detectedBody: boolean;
  estimatedHeight: string;
  estimatedBodyType:
    | "slim"
    | "athletic"
    | "average"
    | "curvy"
    | "plus"
    | "unknown";
  skinTone: string;
  poseDetected: boolean;
  estimatedWaistSize: string;
  estimatedBustSize?: string;
  confidence: number;
  recommendations: string[];
}

/**
 * Analyzes user photo to extract body metrics for personalization
 * Simulates body detection, pose estimation, and dimension extraction
 * In production, integrate with:
 * - TensorFlow.js with Coco-SSD for body detection
 * - MediaPipe for pose estimation and keypoints
 * - OpenCV for image analysis and measurements
 */
function analyzeBodyMetrics(imageData: string): BodyMetrics {
  // Generate consistent metrics based on image hash
  const hash = imageData.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const hashAbs = Math.abs(hash);

  const bodyTypes: Array<"slim" | "athletic" | "average" | "curvy" | "plus"> = [
    "slim",
    "athletic",
    "average",
    "curvy",
    "plus",
  ];

  const bodyType = bodyTypes[hashAbs % bodyTypes.length];

  // Simulate measurements based on body type
  const sizeMap: Record<string, { waist: string; bust?: string }> = {
    slim: { waist: "XS-S", bust: "32-34" },
    athletic: { waist: "S-M", bust: "34-36" },
    average: { waist: "M-L", bust: "36-38" },
    curvy: { waist: "L-XL", bust: "38-40" },
    plus: { waist: "XL-2XL", bust: "40-42" },
  };

  const sizeData = sizeMap[bodyType];

  // Generate personalized recommendations based on body type
  const recommendationMap: Record<string, string[]> = {
    slim: [
      "Look for structured fabrics to add volume",
      "Horizontal stripes and patterns work well",
      "Fitted styles showcase your frame",
      "Layer pieces for dimension",
    ],
    athletic: [
      "Emphasize your fit physique with tailored cuts",
      "Avoid oversized silhouettes",
      "Monochrome looks enhance your lines",
      "Try sports-inspired pieces",
    ],
    average: [
      "Most styles work well with your proportions",
      "Balance top and bottom volumes",
      "Vertical lines are flattering",
      "Mix fitted and relaxed pieces",
    ],
    curvy: [
      "Embrace wrap dresses and cinched waists",
      "Avoid boxy, oversized cuts",
      "Dark colors on lower body create balance",
      "Showcase your curves confidently",
    ],
    plus: [
      "Choose well-fitting, structured pieces",
      "Vertical patterns create a slimming effect",
      "Avoid excessive layering",
      "Statement pieces can elevate any outfit",
    ],
  };

  return {
    detectedFace: hashAbs % 100 > 10, // 90% detection rate
    detectedBody: hashAbs % 100 > 5, // 95% detection rate
    estimatedHeight: [
      "Short (< 160cm)",
      "Medium (160-175cm)",
      "Tall (> 175cm)",
    ][hashAbs % 3],
    estimatedBodyType: bodyType,
    skinTone: ["Fair", "Medium", "Olive", "Deep", "Dark"][hashAbs % 5],
    poseDetected: hashAbs % 100 > 15, // 85% pose detection
    estimatedWaistSize: sizeData.waist,
    estimatedBustSize: sizeData.bust,
    confidence: 0.75 + (hashAbs % 20) / 100,
    recommendations: recommendationMap[bodyType] || [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PhotoAnalysisRequest = await request.json();
    const { photo, email } = body;

    if (!photo || !email) {
      return NextResponse.json(
        { error: "Missing photo or email" },
        { status: 400 },
      );
    }

    // Analyze the photo
    const metrics = analyzeBodyMetrics(photo);

    // Create user profile directory
    const userDir = path.join(process.cwd(), ".data", "user-photos");
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Save photo (base64)
    const sanitizedEmail = email.replace(/[^a-z0-9]/g, "_");
    const photoPath = path.join(userDir, `${sanitizedEmail}.jpg`);
    const metricsPath = path.join(userDir, `${sanitizedEmail}-metrics.json`);

    // Extract base64 data and save
    const base64Data = photo.split(",")[1] || photo;
    fs.writeFileSync(photoPath, Buffer.from(base64Data, "base64"));

    // Save metrics
    fs.writeFileSync(
      metricsPath,
      JSON.stringify(
        {
          email,
          timestamp: new Date().toISOString(),
          ...metrics,
        },
        null,
        2,
      ),
    );

    return NextResponse.json({
      success: true,
      message: "Photo analyzed and stored successfully",
      metrics,
      photoId: sanitizedEmail,
    });
  } catch (error) {
    console.error("Photo analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to retrieve user photo metrics for recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 },
      );
    }

    const sanitizedEmail = email.replace(/[^a-z0-9]/g, "_");
    const metricsPath = path.join(
      process.cwd(),
      ".data",
      "user-photos",
      `${sanitizedEmail}-metrics.json`,
    );

    if (!fs.existsSync(metricsPath)) {
      return NextResponse.json(
        { error: "No metrics found for this user" },
        { status: 404 },
      );
    }

    const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error retrieving metrics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve metrics" },
      { status: 500 },
    );
  }
}
