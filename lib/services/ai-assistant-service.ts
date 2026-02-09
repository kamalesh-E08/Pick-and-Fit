/**
 * AI Assistant Service
 * Supports both Hugging Face free API and local Ollama models
 * Uses Hugging Face Inference API by default, falls back to Ollama for local processing
 */

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface AIResponse {
  message: string;
  recommendedProducts?: string[];
  suggestedActions?: string[];
}

export interface AIServiceConfig {
  useOllama?: boolean;
  ollamaUrl?: string;
  huggingFaceToken?: string;
  model?: string;
}

class AIAssistantService {
  private conversationHistory: ConversationMessage[] = [];
  private useOllama: boolean = false;
  private ollamaUrl: string = "http://localhost:11434";
  private huggingFaceToken: string = "";
  private model: string = "mistral"; // Ollama model
  private huggingFaceModel: string = "meta-llama/Llama-2-7b-chat-hf";

  constructor(config?: AIServiceConfig) {
    this.useOllama = config?.useOllama ?? false;
    this.ollamaUrl = config?.ollamaUrl ?? "http://localhost:11434";
    this.huggingFaceToken = config?.huggingFaceToken ?? "";
    this.model = config?.model ?? "mistral";
  }

  /**
   * Generate a system prompt that includes context about the user's profile and cart
   */
  private getSystemPrompt(userContext?: {
    email?: string;
    cartItems?: number;
    tryOnHistory?: number;
    savedProducts?: number;
  }): string {
    let systemPrompt = `You are a personal AI shopping assistant for Pick & Fit, a fashion and beauty e-commerce platform. 
You help users find products, get styling advice, sizing recommendations, and virtual try-on assistance.

Your capabilities:
1. Product Search: Find products based on descriptions, categories, styles, colors, sizes
2. Styling Advice: Provide personalized fashion and beauty recommendations
3. Size Guidance: Help users find correct sizes based on body metrics and product reviews
4. Virtual Try-On: Suggest products for virtual try-on and style combinations
5. General Shopping: Assist with orders, wishlist, cart management

When recommending products, consider:
- User's style preferences (if mentioned)
- Body metrics and sizing preferences
- Occasion and purpose
- Budget (if mentioned)
- Seasonal trends
- Color and style combinations

Always be friendly, helpful, and professional. If unsure about something, offer to help with product search or styling advice.
When the user asks about specific products, try to identify them from your knowledge and suggest them.`;

    if (userContext) {
      systemPrompt += `\n\nUser Context:
- Email: ${userContext.email || "Unknown"}
- Items in Cart: ${userContext.cartItems ?? 0}
- Try-On History: ${userContext.tryOnHistory ?? 0}
- Saved Products: ${userContext.savedProducts ?? 0}`;
    }

    return systemPrompt;
  }

  /**
   * Format conversation history for the model
   */
  private formatConversationContext(): string {
    return this.conversationHistory
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n");
  }

  /**
   * Generate response using Ollama (local)
   */
  private async generateWithOllama(
    userMessage: string,
    systemPrompt: string,
  ): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\n${this.formatConversationContext()}\nUser: ${userMessage}\nAssistant:`,
          stream: false,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return (
        data.response || "I couldn't generate a response. Please try again."
      );
    } catch (error) {
      console.error("Ollama error:", error);
      throw error;
    }
  }

  /**
   * Generate response using Hugging Face free API
   */
  private async generateWithHuggingFace(
    userMessage: string,
    systemPrompt: string,
  ): Promise<string> {
    try {
      const conversationContext = this.formatConversationContext();
      const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationContext}\n\nUser: ${userMessage}\n\nAssistant:`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
        {
          headers: {
            Authorization: `Bearer ${this.huggingFaceToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 250,
              temperature: 0.7,
              top_p: 0.9,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Hugging Face API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        const result = data[0].generated_text;
        // Extract assistant response (after the prompt)
        const assistantIndex = result.lastIndexOf("Assistant:");
        if (assistantIndex !== -1) {
          return result.substring(assistantIndex + 10).trim();
        }
        return result.trim();
      }

      return "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Hugging Face error:", error);
      throw error;
    }
  }

  /**
   * Try Ollama first, fall back to Hugging Face if needed
   */
  private async generateWithFallback(
    userMessage: string,
    systemPrompt: string,
    preferOllama: boolean = this.useOllama,
  ): Promise<string> {
    if (preferOllama) {
      try {
        console.log("Trying Ollama...");
        return await this.generateWithOllama(userMessage, systemPrompt);
      } catch (ollamaError) {
        console.warn(
          "Ollama failed, falling back to Hugging Face:",
          ollamaError,
        );
        if (!this.huggingFaceToken) {
          throw new Error(
            "Ollama is not available and Hugging Face token is not configured. Please set HUGGING_FACE_TOKEN.",
          );
        }
        return await this.generateWithHuggingFace(userMessage, systemPrompt);
      }
    } else {
      try {
        console.log("Trying Hugging Face...");
        return await this.generateWithHuggingFace(userMessage, systemPrompt);
      } catch (hfError) {
        console.warn("Hugging Face failed, falling back to Ollama:", hfError);
        return await this.generateWithOllama(userMessage, systemPrompt);
      }
    }
  }

  /**
   * Process user message and generate AI response
   */
  async chat(
    userMessage: string,
    userContext?: {
      email?: string;
      cartItems?: number;
      tryOnHistory?: number;
      savedProducts?: number;
    },
  ): Promise<AIResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      const systemPrompt = this.getSystemPrompt(userContext);
      const assistantMessage = await this.generateWithFallback(
        userMessage,
        systemPrompt,
      );

      // Add assistant message to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
      });

      return {
        message: assistantMessage,
        recommendedProducts:
          this.extractProductRecommendations(assistantMessage),
        suggestedActions: this.extractSuggestedActions(assistantMessage),
      };
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage =
        "I'm having trouble processing your request right now. Please try again in a moment.";
      this.conversationHistory.push({
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Extract product recommendations from AI response (using keywords)
   */
  private extractProductRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const keywordPatterns = [
      /recommend.*?(shirt|top|dress|pants|jeans|jacket|coat|sweater|blouse|skirt|shorts|t-shirt|polo|hoodie|cardigan|vest|blazer|suit|lehenga|saree|kurti|choli|salwar|anarkali|dupatta|footwear|shoes|heels|sandals|boots|sneakers|loafers|flats|pumps|slippers)/gi,
      /try.*?(shirt|top|dress|pants|jeans|jacket|coat|sweater|blouse|skirt|shorts|t-shirt|polo|hoodie|cardigan|vest|blazer|suit|lehenga|saree|kurti|choli|salwar|anarkali|dupatta|footwear|shoes|heels|sandals|boots|sneakers|loafers|flats|pumps|slippers)/gi,
      /perfect.*?for.*(shirt|top|dress|pants|jeans|jacket|coat|sweater|blouse|skirt|shorts|t-shirt|polo|hoodie|cardigan|vest|blazer|suit|lehenga|saree|kurti|choli|salwar|anarkali|dupatta|footwear|shoes|heels|sandals|boots|sneakers|loafers|flats|pumps|slippers)/gi,
    ];

    keywordPatterns.forEach((pattern) => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const product = match
            .toLowerCase()
            .replace(/^(recommend|try|perfect.*?for)\s+/i, "");
          if (!recommendations.includes(product)) {
            recommendations.push(product);
          }
        });
      }
    });

    return recommendations.slice(0, 3); // Return top 3
  }

  /**
   * Extract suggested actions from AI response
   */
  private extractSuggestedActions(response: string): string[] {
    const actions: string[] = [];
    const actionPatterns = [
      /try.*?virtual try-on/i,
      /add.*?to cart/i,
      /save.*?to wishlist/i,
      /check.*?size guide/i,
      /read.*?reviews/i,
      /apply.*?coupon/i,
      /view.*?details/i,
    ];

    actionPatterns.forEach((pattern) => {
      if (pattern.test(response)) {
        const match = response.match(pattern);
        if (match) {
          actions.push(match[0]);
        }
      }
    });

    return actions;
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Reset and configure service
   */
  configure(config: AIServiceConfig): void {
    this.useOllama = config.useOllama ?? this.useOllama;
    this.ollamaUrl = config.ollamaUrl ?? this.ollamaUrl;
    this.huggingFaceToken = config.huggingFaceToken ?? this.huggingFaceToken;
    this.model = config.model ?? this.model;
  }

  /**
   * Check if Ollama is available
   */
  async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiAssistantService = new AIAssistantService({
  useOllama: process.env.NEXT_PUBLIC_USE_OLLAMA === "true" || false,
  ollamaUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
  huggingFaceToken: process.env.HUGGING_FACE_TOKEN || "",
  model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "mistral",
});

export default AIAssistantService;
