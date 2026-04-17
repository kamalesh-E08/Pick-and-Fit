"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAI } from "@/context/ai-context";
import { VoiceInput } from "./voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader,
  Send,
  Trash2,
  MessageCircle,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  compact?: boolean;
  showVoiceInput?: boolean;
  onProductSelect?: (productName: string) => void;
}

function renderAssistantContent(content: string) {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/\s+(\d+\.\s)/g, "\n$1")
    .replace(/\s+(-\s)/g, "\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const blocks = normalized
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const numberedLines = block
          .split("\n")
          .filter(Boolean)
          .filter((line) => /^\d+\.\s+/.test(line.trim()));

        const bulletLines = block
          .split("\n")
          .filter(Boolean)
          .filter((line) => /^[-•]\s+/.test(line.trim()));

        if (
          numberedLines.length > 1 &&
          numberedLines.length === block.split("\n").filter(Boolean).length
        ) {
          return (
            <ol
              key={`ol-${blockIndex}`}
              className="list-decimal pl-5 space-y-1.5"
            >
              {numberedLines.map((line, index) => (
                <li key={`ol-${blockIndex}-${index}`}>
                  {line.replace(/^\d+\.\s+/, "").trim()}
                </li>
              ))}
            </ol>
          );
        }

        if (
          bulletLines.length > 1 &&
          bulletLines.length === block.split("\n").filter(Boolean).length
        ) {
          return (
            <ul key={`ul-${blockIndex}`} className="list-disc pl-5 space-y-1.5">
              {bulletLines.map((line, index) => (
                <li key={`ul-${blockIndex}-${index}`}>
                  {line.replace(/^[-•]\s+/, "").trim()}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`p-${blockIndex}`}
            className="whitespace-pre-wrap break-words"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
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
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">
            Initializing AI Assistant...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact ? "h-full flex flex-col" : "")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">
            Personal AI Assistant
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Live
          </span>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={handleClearHistory}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div
        className={cn(
          "border border-border rounded-xl bg-muted/30 shadow-inner",
          compact ? "flex-1 overflow-hidden" : "h-96",
        )}
      >
        <ScrollArea className="h-full p-4">
          <div className="space-y-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4 text-center py-8">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">
                    No messages yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try asking about products, sizing, or style tips!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3 items-end",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-none">
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-xs sm:max-w-md px-4 py-3 rounded-3xl shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none rounded-tl-3xl rounded-tr-3xl"
                        : "bg-card border border-border text-card-foreground rounded-bl-none rounded-tl-3xl rounded-tr-3xl",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
                          A
                        </span>
                        <span>AI Assistant</span>
                      </div>
                    )}
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      renderAssistantContent(msg.content)
                    )}
                    {msg.timestamp && (
                      <p
                        className={cn(
                          "text-xs mt-2 opacity-80",
                          msg.role === "user"
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
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
                <div className="bg-card border border-border text-card-foreground rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Suggested questions:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-left p-2.5 text-sm rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIAssistant;
