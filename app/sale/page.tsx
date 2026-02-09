import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalePage() {
  return (
    <div className="container py-10 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sale</h1>
        <p className="text-muted-foreground mt-2">
          Limited-time deals on trending styles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Save on best sellers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Discover discounted products and seasonal offers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">Shop sale</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/flash-deals">Flash deals</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
