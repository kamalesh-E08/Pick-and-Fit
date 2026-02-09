"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function VisualRecommendations({
  productId,
}: {
  productId: string;
}) {
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/recommendations?productId=${productId}&k=4`,
      );
      const data = await res.json();
      if (!cancelled && data?.recommendations) setRecs(data.recommendations);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (recs.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Visual Recommendations</h2>
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
    </div>
  );
}
