"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AIAssistantService, {
  ConversationMessage,
  AIResponse,
} from "@/lib/services/ai-assistant-service";
import { useAuth } from "./auth-context";
import { useCart } from "./cart-context";

interface AIContextType {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => void;
  isInitialized: boolean;
  lastResponse?: AIResponse;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse>();
  const auth = useAuth();
  const cart = useCart();

  // Initialize AI service
  useEffect(() => {
    try {
      const token = process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN;
      const useOllama = process.env.NEXT_PUBLIC_USE_OLLAMA === "true";

      if (!token && !useOllama) {
        console.warn(
          "No AI service configured. Please set environment variables.",
        );
      }

      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to initialize AI context:", err);
      setError("Failed to initialize AI service");
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Add user message to history
        const userMessage: ConversationMessage = {
          role: "user",
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Create AI service instance
        const aiService = new AIAssistantService({
          useOllama: process.env.NEXT_PUBLIC_USE_OLLAMA === "true",
          huggingFaceToken: process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN,
        });

        // Get user context for better recommendations
        const userContext = {
          email: auth?.user?.email,
          cartItems: cart?.items?.length ?? 0,
          tryOnHistory: 0, // Could be fetched from DB
          savedProducts: 0, // Could be fetched from DB
        };

        // Get AI response
        const response = await aiService.chat(message, userContext);

        // Add assistant message to history
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastResponse(response);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get AI response";
        setError(errorMessage);
        console.error("AI chat error:", err);

        // Add error message
        const errorMsg: ConversationMessage = {
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [auth?.user?.email, cart?.items?.length],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastResponse(undefined);
  }, []);

  const value: AIContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    isInitialized,
    lastResponse,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within AIProvider");
  }
  return context;
};
