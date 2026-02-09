import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="container flex items-center justify-center py-14 px-4 min-h-[calc(100vh-14rem)]">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Profile not available</h1>
        <p className="text-muted-foreground mt-3">
          We couldn&apos;t find that profile. Please sign in and try again.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
