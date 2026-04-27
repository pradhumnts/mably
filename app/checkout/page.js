"use client";

import { useEffect, useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";
import Link from "next/link";

/**
 * Public page for Paddle “default payment link” + Paddle.js script host.
 * Your dashboard can point here: https://your-domain.com/checkout
 */
export default function CheckoutHostPage() {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
    const envRaw = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "").trim().toLowerCase();
    const environment = envRaw === "production" ? "production" : "sandbox";

    if (!token) {
      setMissing(true);
      return;
    }

    initializePaddle({ token, environment })
      .then((instance) => setReady(Boolean(instance)))
      .catch(() => setMissing(true));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Mably checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {missing
            ? "Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to your environment to load Paddle.js."
            : ready
              ? "Paddle.js is ready. Choose a plan after signing in."
              : "Loading Paddle.js…"}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Sign in to Mably
          </Link>
          <Link
            href="/billing"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium"
          >
            Billing (signed in)
          </Link>
        </div>
      </div>
    </div>
  );
}
