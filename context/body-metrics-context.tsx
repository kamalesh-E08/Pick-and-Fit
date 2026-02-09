"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

interface BodyMetricsContextType {
  metrics: BodyMetrics | null;
  setMetrics: (metrics: BodyMetrics) => void;
  clearMetrics: () => void;
  isLoading: boolean;
  fetchMetrics: (email: string) => Promise<void>;
}

const BodyMetricsContext = createContext<BodyMetricsContextType | undefined>(
  undefined,
);

export function BodyMetricsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, setMetrics] = useState<BodyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchEmail, setLastFetchEmail] = useState<string | null>(null);
  const [lastFetchStatus, setLastFetchStatus] = useState<
    "idle" | "ok" | "not_found" | "error"
  >("idle");

  // Load metrics from localStorage on mount
  useEffect(() => {
    const storedMetrics = localStorage.getItem("bodyMetrics");
    if (storedMetrics) {
      try {
        setMetrics(JSON.parse(storedMetrics));
      } catch {
        console.error("Failed to parse stored body metrics");
      }
    }
  }, []);

  const updateMetrics = (newMetrics: BodyMetrics) => {
    setMetrics(newMetrics);
    localStorage.setItem("bodyMetrics", JSON.stringify(newMetrics));
  };

  const clearMetrics = () => {
    setMetrics(null);
    localStorage.removeItem("bodyMetrics");
  };

  const fetchMetrics = async (email: string) => {
    if (lastFetchEmail === email && lastFetchStatus === "not_found") {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analyze-photo?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        updateMetrics(data);
        setLastFetchEmail(email);
        setLastFetchStatus("ok");
        return;
      }

      if (response.status === 404) {
        setLastFetchEmail(email);
        setLastFetchStatus("not_found");
        return;
      }
    } catch (error) {
      console.error("Failed to fetch body metrics:", error);
      setLastFetchStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BodyMetricsContext.Provider
      value={{
        metrics,
        setMetrics: updateMetrics,
        clearMetrics,
        isLoading,
        fetchMetrics,
      }}
    >
      {children}
    </BodyMetricsContext.Provider>
  );
}

export function useBodyMetrics() {
  const context = useContext(BodyMetricsContext);
  if (context === undefined) {
    throw new Error("useBodyMetrics must be used within BodyMetricsProvider");
  }
  return context;
}
