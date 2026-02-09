import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfileEditNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-6">
          Profile edit page not found
        </p>
        <Button asChild className="bg-pink-600 hover:bg-pink-700">
          <Link href="/profile">Go to Profile</Link>
        </Button>
      </div>
    </div>
  );
}
