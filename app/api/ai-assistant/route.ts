import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";
import AIAssistantService from "@/lib/services/ai-assistant-service";
import mongoose from "mongoose";
/**
 * AI Assistant Chat API Route
 * POST /api/ai-assistant
 *
 * Handles AI conversation requests
 */

interface ChatRequest {
  message: string;
  userEmail?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  userContext?: {
    email?: string;
    cartItems?: number;
    tryOnHistory?: number;
    savedProducts?: number;
  };
}

interface StoredConversation {
  userEmail: string;
  message: string;
  response: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      userEmail,
      conversationHistory,
      userContext: clientUserContext,
    } = body;

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
    let userContext: {
      email?: string;
      cartItems?: number;
      tryOnHistory?: number;
      savedProducts?: number;
    } = {
      email: userEmail,
      ...clientUserContext,
    };
    if (userEmail) {
      try {
        await connect();
        const db = mongoose.connection.db;
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
      huggingFaceModel: process.env.HUGGING_FACE_MODEL || "gpt2",
      model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "mistral",
    });

    // Get AI response
    const response = await aiService.chat(
      message,
      userContext,
      conversationHistory,
    );

    // Log conversation if email provided
    if (userEmail) {
      try {
        await connect();
        const db = mongoose.connection.db;
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
      { error: errorMessage || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check AI service status or fetch conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim();
    const mode = searchParams.get("mode")?.trim();

    if (mode === "history" || userEmail) {
      if (!userEmail) {
        return NextResponse.json(
          { error: "userEmail query parameter is required for history mode" },
          { status: 400 },
        );
      }

      try {
        await connect();
        const db = mongoose.connection.db;
        const conversationCollection =
          db.collection<StoredConversation>("ai_conversations");

        const records = await conversationCollection
          .find({ userEmail })
          .sort({ timestamp: 1 })
          .limit(100)
          .toArray();

        const messages = records.flatMap((record) => [
          {
            role: "user",
            content: record.message,
            timestamp: record.timestamp,
          },
          {
            role: "assistant",
            content: record.response,
            timestamp: record.timestamp,
          },
        ]);

        return NextResponse.json({ messages }, { status: 200 });
      } catch (historyError) {
        console.error("Failed to fetch AI history:", historyError);
        return NextResponse.json(
          { error: "Failed to fetch AI conversation history" },
          { status: 500 },
        );
      }
    }

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

/**
 * DELETE endpoint to clear user conversation history
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail")?.trim();

    if (!userEmail) {
      return NextResponse.json(
        { error: "userEmail query parameter is required" },
        { status: 400 },
      );
    }

    await connect();
    const db = mongoose.connection.db;
    const conversationCollection = db.collection("ai_conversations");
    const result = await conversationCollection.deleteMany({ userEmail });

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to clear AI history:", error);
    return NextResponse.json(
      { error: "Failed to clear AI conversation history" },
      { status: 500 },
    );
  }
}
