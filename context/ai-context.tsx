"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  ConversationMessage,
  AIResponse,
} from "@/lib/services/ai-assistant-service";
import { useAuth } from "./auth-context";
import { useCart } from "./cart-context";

const GUEST_HISTORY_KEY = "pickfit_ai_guest_history";

interface AIHistoryResponse {
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
  }>;
}

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

  useEffect(() => {
    if (!isInitialized || auth?.isLoading) return;

    const loadHistory = async () => {
      setError(null);

      const userEmail = auth?.user?.email;
      if (!userEmail) {
        try {
          const stored = localStorage.getItem(GUEST_HISTORY_KEY);
          if (!stored) {
            setMessages([]);
            return;
          }

          const parsed = JSON.parse(stored) as ConversationMessage[];
          const hydratedMessages = parsed.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
          }));
          setMessages(hydratedMessages);
        } catch {
          setMessages([]);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/ai-assistant?mode=history&userEmail=${encodeURIComponent(userEmail)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load AI conversation history");
        }

        const data: AIHistoryResponse = await response.json();
        const history = (data.messages ?? []).map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
        }));

        setMessages(history);
      } catch (err) {
        console.warn("Failed to load AI history:", err);
        setMessages([]);
      }
    };

    loadHistory();
  }, [auth?.isLoading, auth?.user?.email, isInitialized]);

  useEffect(() => {
    if (!isInitialized || auth?.user?.email) return;
    localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(messages));
  }, [auth?.user?.email, isInitialized, messages]);

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

        // Get user context for better recommendations
        const userContext = {
          email: auth?.user?.email,
          cartItems: cart?.items?.length ?? 0,
          tryOnHistory: 0, // Could be fetched from DB
          savedProducts: 0, // Could be fetched from DB
        };

        const response = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            userEmail: auth?.user?.email,
            conversationHistory: messages.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            userContext,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to get AI response");
        }

        const result: AIResponse = await response.json();

        // Add assistant message to history
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastResponse(result);
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

    if (!auth?.user?.email) {
      localStorage.removeItem(GUEST_HISTORY_KEY);
      return;
    }

    fetch(
      `/api/ai-assistant?userEmail=${encodeURIComponent(auth.user.email)}`,
      {
        method: "DELETE",
      },
    ).catch((err) => {
      console.warn("Failed to clear persisted AI history:", err);
    });
  }, [auth?.user?.email]);

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
