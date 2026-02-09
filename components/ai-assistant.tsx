"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAI } from "@/context/ai-context";
import { VoiceInput } from "./voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader,
  Send,
  Trash2,
  MessageCircle,
  Lightbulb,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  compact?: boolean;
  showVoiceInput?: boolean;
  onProductSelect?: (productName: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  compact = false,
  showVoiceInput = true,
  onProductSelect,
}) => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    isInitialized,
  } = useAI();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  // Example prompts for quick start
  const examplePrompts = [
    "What dress would look good for a wedding?",
    "I need sizing help for jeans",
    "Can you recommend products for casual wear?",
    "What's trendy for this season?",
  ];

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || !isInitialized) return;

    setInput("");

    try {
      await sendMessage(text);
    } catch (err) {
      toast.error("Failed to send message");
      console.error("Send message error:", err);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript);
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success("Conversation cleared");
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Initializing AI Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact ? "h-full flex flex-col" : "")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Personal AI Assistant</h3>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={handleClearHistory}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div
        className={cn(
          "border rounded-lg bg-gray-50",
          compact ? "flex-1 overflow-hidden" : "h-96",
        )}
      >
        <ScrollArea className="h-full p-4">
          <div className="space-y-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4 text-center py-8">
                <Lightbulb className="w-12 h-12 mx-auto text-yellow-500" />
                <div>
                  <p className="font-semibold text-gray-700 mb-2">
                    No messages yet
                  </p>
                  <p className="text-sm text-gray-600">
                    Try asking about products, sizing, or style tips!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs px-4 py-2 rounded-lg",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none",
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    {msg.timestamp && (
                      <p
                        className={cn(
                          "text-xs mt-1",
                          msg.role === "user"
                            ? "text-blue-100"
                            : "text-gray-500",
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-white border border-gray-200 text-gray-800 rounded-lg rounded-bl-none px-4 py-2">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-semibold">
            Suggested questions:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-left p-2 text-sm rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Input */}
      {showVoiceInput && (
        <VoiceInput
          onTranscript={handleVoiceInput}
          onListeningChange={setIsListening}
          disabled={isLoading}
          placeholder="Click to start speaking..."
        />
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading && !isListening) {
              handleSendMessage();
            }
          }}
          placeholder="Type or speak your question..."
          disabled={isLoading || isListening || !isInitialized}
          className="flex-1"
        />
        <Button
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading || isListening || !isInitialized}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
