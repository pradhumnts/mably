"use client";

import Link from "next/link";
// import { LegalFooterLinks } from "@/components/legal-footer-links"; // hidden until legal pages are live

/**
 * Public checkout landing. Subscriptions are created from Settings → Subscription when signed in.
 */
export default function CheckoutHostPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Mably checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Billing is powered by Polar. Sign in and open Settings → Subscription to choose Starter or Growth.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Sign in to Mably
          </Link>
          <Link
            href="/settings?tab=subscription"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium"
          >
            Subscription (signed in)
          </Link>
        </div>
      </div>
      {/* <LegalFooterLinks className="mt-6 text-[11px]" /> */}
    </div>
  );
}
