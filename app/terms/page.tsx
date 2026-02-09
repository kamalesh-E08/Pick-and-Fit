import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="container py-10 px-4 max-w-4xl">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Last updated: Feb 5, 2026
        </p>
        <h1 className="text-3xl font-bold mt-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mt-3">
          These terms govern your access to Pick&amp;Fit and the services we
          provide. By using the site, you agree to the terms below.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">1. Account & Security</h2>
          <p className="text-muted-foreground">
            You&apos;re responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">2. Orders & Payments</h2>
          <p className="text-muted-foreground">
            All purchases are subject to product availability and confirmation
            of the order price. We may cancel or refuse any order at our
            discretion.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">3. Try-at-Home</h2>
          <p className="text-muted-foreground">
            The try-at-home service is available for eligible products and
            locations. Items must be returned in original condition within the
            specified trial period.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">4. Returns & Refunds</h2>
          <p className="text-muted-foreground">
            Returns are accepted according to our return policy. Refunds are
            processed to the original payment method after inspection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">5. User Content</h2>
          <p className="text-muted-foreground">
            By submitting content (reviews, photos, or feedback), you grant
            Pick&amp;Fit a non-exclusive, royalty-free license to use and
            display that content for service improvement and marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">6. Privacy</h2>
          <p className="text-muted-foreground">
            Your data is handled according to our privacy practices. For more
            details, please contact support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">7. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We may update these terms from time to time. Continued use of the
            service after changes constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    </div>
  );
}
