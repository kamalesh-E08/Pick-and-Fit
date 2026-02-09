import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewArrivalsPage() {
  return (
    <div className="container py-10 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Arrivals</h1>
        <p className="text-muted-foreground mt-2">
          Fresh drops and just-in styles curated for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Explore the latest collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Browse our newest products across all categories.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">Shop new arrivals</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/shop/men">Men</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/shop/women">Women</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/shop/kids">Kids</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
