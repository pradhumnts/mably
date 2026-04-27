"use client";

import { useCallback, useEffect, useState } from "react";
import { initializePaddle } from "@paddle/paddle-js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Check, CreditCard } from "lucide-react";
import { toast } from "sonner";

const starterFeatures = [
  "1 active project",
  "Full client portal",
  "Files & links library",
  "Project chat",
  "Activity feed",
  "1 GB storage · up to 10 MB per file",
  "Milestones & payment links",
  "Email notifications",
  "Client CRM",
];

const growthFeatures = [
  "Everything in Starter",
  "Unlimited projects",
  "50 GB storage · no per-file limit",
  "Custom domain",
  "Hide Powered by tag",
  "Priority support",
];

export function BillingPageClient({
  userId,
  email,
  paddleEnvironment,
  starterPriceId,
  growthPriceId,
  initialSubscription,
}) {
  const [paddle, setPaddle] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
    if (!token) return;

    const env = paddleEnvironment === "production" ? "production" : "sandbox";

    initializePaddle({
      token,
      environment: env,
    })
      .then((instance) => {
        if (instance) setPaddle(instance);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not initialize Paddle checkout.");
      });
  }, [paddleEnvironment]);

  const openCheckout = useCallback(
    (priceId) => {
      if (!priceId) {
        toast.error("Missing price ID — set NEXT_PUBLIC_PADDLE_PRICE_* in env.");
        return;
      }
      if (!paddle?.Checkout?.open) {
        toast.error("Checkout is still loading. Try again in a moment.");
        return;
      }

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { supabase_user_id: String(userId) },
        settings: {
          displayMode: "overlay",
          ...(origin ? { successUrl: `${origin}/billing` } : {}),
        },
      });
    },
    [paddle, email, userId]
  );

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not open portal");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e?.message ?? "Portal session failed");
    } finally {
      setPortalLoading(false);
    }
  };

  const hasToken = Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim());
  const canManage = Boolean(initialSubscription?.paddle_customer_id);

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Billing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribe with Paddle. Status updates after checkout via webhooks (may take a few
              seconds).
            </p>
          </div>

          {!hasToken ? (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Configure Paddle</CardTitle>
                <CardDescription>
                  Add <code className="text-xs">NEXT_PUBLIC_PADDLE_CLIENT_TOKEN</code> and price
                  IDs to your environment, then redeploy.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {initialSubscription ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Current subscription</CardTitle>
                  <CardDescription>
                    Plan:{" "}
                    <span className="font-medium text-foreground">
                      {initialSubscription.plan_key ?? "—"}
                    </span>{" "}
                    · Status:{" "}
                    <span className="font-medium text-foreground">{initialSubscription.status}</span>
                  </CardDescription>
                </div>
                {canManage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void openPortal()}
                    disabled={portalLoading}
                  >
                    <CreditCard className="h-4 w-4" />
                    {portalLoading ? "Opening…" : "Manage subscription"}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {initialSubscription.current_period_end
                  ? `Current period ends (UTC): ${initialSubscription.current_period_end}`
                  : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col border-border/80">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>$9/mo · try the workflow</CardDescription>
                <p className="pt-2 text-3xl font-bold tracking-tight">$9</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {starterFeatures.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto w-full"
                  onClick={() => openCheckout(starterPriceId)}
                  disabled={!hasToken}
                >
                  Subscribe — Starter
                </Button>
              </CardContent>
            </Card>

            <Card className="relative flex flex-col border-orange-500/50 bg-gradient-to-b from-orange-50/80 via-card to-card shadow-md dark:from-orange-950/25 dark:via-card dark:to-card">
             
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <CardDescription>$19/mo · full workspace</CardDescription>
                <p className="pt-2 text-3xl font-bold tracking-tight">$19</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  {growthFeatures.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto w-full"
                  onClick={() => openCheckout(growthPriceId)}
                  disabled={!hasToken}
                >
                  Subscribe — Growth
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
