"use client";

import React, { Suspense, useEffect, useState } from "react";
import AIAssistant from "@/components/ai-assistant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Lightbulb, Zap, Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface AIServiceStatus {
  status: string;
  huggingFaceConfigured: boolean;
  ollamaAvailable: boolean;
  primaryService: string;
  error?: string;
}

export default function AIAssistantPage() {
  const [serviceStatus, setServiceStatus] = useState<AIServiceStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/ai-assistant");
        if (!res.ok) {
          throw new Error("Failed to load AI service status");
        }
        const data = (await res.json()) as AIServiceStatus;
        setServiceStatus(data);
      } catch (err) {
        setStatusError(
          err instanceof Error ? err.message : "Unable to determine AI status",
        );
      }
    }

    fetchStatus();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Personal AI Shopping Assistant
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Your smart shopping companion powered by AI. Ask about products,
            styles, sizing, and more!
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-border bg-card/90 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Smart Recommendations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized product suggestions based on your preferences
                  and style
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/90 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Voice Input
                </h3>
                <p className="text-sm text-muted-foreground">
                  Simply speak your questions and let the AI understand your
                  needs
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/90 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Expert Styling Tips
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get professional fashion and styling advice tailored to you
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        {serviceStatus ? (
          <div
            className={`rounded-2xl border px-4 py-3 mb-6 text-sm ${
              serviceStatus.status !== "ok"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : serviceStatus.huggingFaceConfigured
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-sky-50 border-sky-200 text-sky-900"
            }`}
          >
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                AI service status: {serviceStatus.status === "ok" ? "Available" : "Unavailable"}.
              </p>
              <p>
                {serviceStatus.primaryService === "ollama"
                  ? "Running on local Ollama."
                  : "Running on Hugging Face cloud."}
              </p>
              {!serviceStatus.huggingFaceConfigured && (
                <p>
                  Hugging Face is not configured. Add your
                  <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
                    HUGGING_FACE_TOKEN
                  </code>
                  in Vercel or enable local Ollama.
                </p>
              )}
            </div>
          </div>
        ) : statusError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 mb-6">
            {statusError}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground mb-6">
            Checking AI service status...
          </div>
        )}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="help">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="p-6 border-border shadow-sm bg-card/95">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Loading AI Assistant...
                      </p>
                    </div>
                  </div>
                }
              >
                <AIAssistant showVoiceInput={true} />
              </Suspense>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card className="p-8 border-border shadow-sm bg-card/95">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    What can the AI Assistant do?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        🛍️ Product Discovery
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Find products by description or category</li>
                        <li>• Search by style, color, or occasion</li>
                        <li>• Get trending items and new arrivals</li>
                        <li>• Filter by price range and preferences</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        📐 Sizing Help
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Get correct size recommendations</li>
                        <li>• Understand sizing across brands</li>
                        <li>• Read customer reviews for fit</li>
                        <li>• Body metric-based suggestions</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        👗 Styling Advice
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Fashion and style recommendations</li>
                        <li>• Outfit combinations and pairing</li>
                        <li>• Seasonal trends and tips</li>
                        <li>• Personal style consultation</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        🎯 Virtual Try-On
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Suggest products for virtual try-on</li>
                        <li>• Style matching recommendations</li>
                        <li>• Visual outfit preview tips</li>
                        <li>• Confidence scoring for matches</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    How to use voice input:
                  </h3>
                  <ol className="space-y-3 text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">
                        1.
                      </span>
                      <span>Click the "Start Voice Input" button</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">
                        2.
                      </span>
                      <span>
                        Speak your question clearly (you have 30 seconds)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">
                        3.
                      </span>
                      <span>
                        Your speech will be converted to text automatically
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">
                        4.
                      </span>
                      <span>Review the transcript and send your message</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">
                        5.
                      </span>
                      <span>Get personalized AI recommendations instantly</span>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Example questions to ask:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "What formal dress would suit me for a wedding?",
                      "I need help finding my correct jeans size",
                      "Show me trendy casual outfits for spring",
                      "What should I wear for a beach vacation?",
                      "Can you suggest complementary accessories?",
                      "What's your recommendation for professional attire?",
                      "I want to try dresses virtually - what do you suggest?",
                      "Help me find sustainable fashion options",
                    ].map((question, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <p className="text-sm text-foreground">"{question}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>💡 Tip:</strong> The AI learns from your preferences
                    the more you interact. Save products you like, leave
                    reviews, and your recommendations will improve!
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Technology Info */}
        <div className="mt-8 p-6 bg-card/80 rounded-lg border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">
            🚀 Powered by Latest AI Technology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">AI Models</p>
              <p>Ollama (local) + Hugging Face (cloud)</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">
                Voice Recognition
              </p>
              <p>Web Speech API (browser-native)</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Integration</p>
              <p>Cart, Wishlist, Virtual Try-On, Orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
