"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useBodyMetrics } from "@/context/body-metrics-context";

export default function HomeRecommendations() {
  const [recs, setRecs] = useState<any[]>([]);
  const { user } = useAuth();
  const { metrics } = useBodyMetrics();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = user?.email;

      // Build URL with body metrics if available
      let url = `/api/recommendations?type=personalized${userId ? `&userId=${encodeURIComponent(userId)}` : ""}&k=6`;

      if (metrics) {
        url += `&bodyType=${encodeURIComponent(metrics.estimatedBodyType)}`;
        if (metrics.estimatedHeight) {
          url += `&height=${encodeURIComponent(metrics.estimatedHeight)}`;
        }
        if (metrics.skinTone) {
          url += `&skinTone=${encodeURIComponent(metrics.skinTone)}`;
        }
        if (metrics.poseDetected) {
          url += `&poseDetected=true`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!cancelled && data?.recommendations) setRecs(data.recommendations);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email, metrics]);

  if (recs.length === 0) return null;

  return (
    <section className="container px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Recommended for you</h2>
          {metrics && (
            <p className="text-sm text-gray-600 mt-1">
              Based on your {metrics.estimatedBodyType} body type
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {recs.map((r) => (
          <Link key={r.id} href={`/product/${r.id}`}>
            <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
              <div className="relative aspect-square">
                <Image
                  src={r.image || "/placeholder.svg"}
                  alt={r.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1">{r.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium text-sm">
                    ₹{r.price?.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
