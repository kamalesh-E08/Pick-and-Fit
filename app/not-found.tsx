import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center py-14 px-4 min-h-[calc(100vh-14rem)]">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl font-bold mt-2">Page not found</h1>
        <p className="text-muted-foreground mt-3">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
