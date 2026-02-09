import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/db/connection";

/**
 * Voice Search API Route
 * POST /api/voice-search
 *
 * Processes voice input and returns product search results
 */

interface VoiceSearchRequest {
  query: string;
  userEmail?: string;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceSearchRequest = await request.json();
    const { query, userEmail, filters } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Invalid request: query is required" },
        { status: 400 },
      );
    }

    // Validate query length
    if (query.trim().length === 0 || query.length > 500) {
      return NextResponse.json(
        { error: "Query must be between 1 and 500 characters" },
        { status: 400 },
      );
    }

    const db = await connect();
    const productsCollection = db.collection("products");

    // Build search query
    const searchQuery: any = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    };

    // Apply filters if provided
    if (filters?.category) {
      searchQuery.category = filters.category;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      searchQuery.price = {};
      if (filters.minPrice) {
        searchQuery.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        searchQuery.price.$lte = filters.maxPrice;
      }
    }

    if (filters?.size) {
      searchQuery.sizes = filters.size;
    }

    // Execute search
    const results = await productsCollection
      .find(searchQuery)
      .limit(10)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        price: 1,
        category: 1,
        image: 1,
        rating: 1,
      })
      .toArray();

    // Log search query if user email provided
    if (userEmail) {
      try {
        const searchLogsCollection = db.collection("search_logs");
        await searchLogsCollection.insertOne({
          userEmail,
          query,
          filters,
          resultsCount: results.length,
          timestamp: new Date(),
          searchType: "voice",
        });
      } catch (logError) {
        console.warn("Failed to log search:", logError);
      }
    }

    // Parse results to ensure proper types
    const parsedResults = results.map((product: any) => ({
      id: product._id?.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      rating: product.rating,
    }));

    return NextResponse.json(
      {
        query,
        resultsCount: parsedResults.length,
        results: parsedResults,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Voice search error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("connection")) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Failed to process voice search" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to get search suggestions based on partial query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const userEmail = searchParams.get("email");

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const db = await connect();
    const productsCollection = db.collection("products");

    // Get suggestions from product names
    const suggestions = await productsCollection
      .find({
        name: { $regex: `^${query}`, $options: "i" },
      })
      .limit(5)
      .project({ name: 1 })
      .toArray();

    // Also get suggestions from categories
    const categories = await productsCollection
      .find({
        category: { $regex: query, $options: "i" },
      })
      .limit(3)
      .project({ category: 1 })
      .toArray();

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...suggestions.map((p: any) => p.name),
      ...categories.map((p: any) => p.category),
    ];
    const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 8);

    return NextResponse.json(
      { suggestions: uniqueSuggestions },
      { status: 200 },
    );
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
