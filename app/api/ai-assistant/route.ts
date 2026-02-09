import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import AIAssistantService from "@/lib/services/ai-assistant-service";

/**
 * AI Assistant Chat API Route
 * POST /api/ai-assistant
 *
 * Handles AI conversation requests
 */

interface ChatRequest {
  message: string;
  userEmail?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, userEmail, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid request: message is required" },
        { status: 400 },
      );
    }

    // Validate message length
    if (message.trim().length === 0 || message.length > 1000) {
      return NextResponse.json(
        { error: "Message must be between 1 and 1000 characters" },
        { status: 400 },
      );
    }

    // Get user context from database if email is provided
    let userContext: any = { email: userEmail };
    if (userEmail) {
      try {
        const db = await connect();
        const userCollection = db.collection("users");
        const user = await userCollection.findOne({ email: userEmail });

        if (user) {
          // Get cart items count
          const cartCollection = db.collection("carts");
          const cart = await cartCollection.findOne({ userEmail });
          userContext.cartItems = cart?.items?.length ?? 0;

          // Get try-on history count
          const tryOnCollection = db.collection("virtual_try_ons");
          const tryOnCount = await tryOnCollection.countDocuments({
            userEmail,
          });
          userContext.tryOnHistory = tryOnCount;

          // Get saved products count
          const wishlistCollection = db.collection("wishlists");
          const wishlist = await wishlistCollection.findOne({ userEmail });
          userContext.savedProducts = wishlist?.items?.length ?? 0;
        }
      } catch (dbError) {
        console.warn("Failed to fetch user context:", dbError);
        // Continue without user context
      }
    }

    // Create AI service instance
    const aiService = new AIAssistantService({
      useOllama: process.env.NEXT_PUBLIC_USE_OLLAMA === "true",
      huggingFaceToken: process.env.HUGGING_FACE_TOKEN,
      model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "mistral",
    });

    // Get AI response
    const response = await aiService.chat(message, userContext);

    // Log conversation if email provided
    if (userEmail) {
      try {
        const db = await connect();
        const conversationCollection = db.collection("ai_conversations");
        await conversationCollection.insertOne({
          userEmail,
          message,
          response: response.message,
          recommendedProducts: response.recommendedProducts,
          suggestedActions: response.suggestedActions,
          timestamp: new Date(),
          model:
            process.env.NEXT_PUBLIC_USE_OLLAMA === "true"
              ? "ollama"
              : "hugging-face",
        });
      } catch (logError) {
        console.warn("Failed to log conversation:", logError);
        // Continue even if logging fails
      }
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("AI Assistant API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";

    // Check for specific error types
    if (
      errorMessage.includes("Ollama") &&
      errorMessage.includes("Hugging Face")
    ) {
      return NextResponse.json(
        {
          error:
            "AI service unavailable. Please configure Ollama or set HUGGING_FACE_TOKEN environment variable.",
        },
        { status: 503 },
      );
    }

    if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "Service rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check AI service status
 */
export async function GET() {
  try {
    const aiService = new AIAssistantService({
      useOllama: process.env.NEXT_PUBLIC_USE_OLLAMA === "true",
      huggingFaceToken: process.env.HUGGING_FACE_TOKEN,
    });

    const isOllamaAvailable = await aiService.isOllamaAvailable();
    const hasHuggingFaceToken = !!process.env.HUGGING_FACE_TOKEN;

    return NextResponse.json({
      status: "ok",
      ollamaAvailable: isOllamaAvailable,
      huggingFaceConfigured: hasHuggingFaceToken,
      primaryService: isOllamaAvailable ? "ollama" : "hugging-face",
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to check AI service status" },
      { status: 500 },
    );
  }
}
