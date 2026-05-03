"use client";

import { useCallback, useState } from "react";
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

export function BillingPageClient({ polarConfigured, initialSubscription }) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const startCheckout = useCallback(
    async (plan) => {
      setCheckoutLoading(plan);
      try {
        const res = await fetch("/api/billing/polar-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Could not start checkout");
        if (!json.url) throw new Error("No checkout URL returned");
        window.location.href = json.url;
      } catch (e) {
        toast.error(e?.message ?? "Checkout failed");
      } finally {
        setCheckoutLoading(null);
      }
    },
    []
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

  const canManage = Boolean(initialSubscription?.polar_customer_id);

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
              Subscribe with Polar. Status updates after checkout via webhooks (may take a few
              seconds).
            </p>
          </div>

          {!polarConfigured ? (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base">Configure Polar</CardTitle>
                <CardDescription>
                  Set server env <code className="text-xs">POLAR_ACCESS_TOKEN</code>,{" "}
                  <code className="text-xs">POLAR_WEBHOOK_SECRET</code>,{" "}
                  <code className="text-xs">POLAR_PRODUCT_ID_STARTER</code>, and{" "}
                  <code className="text-xs">POLAR_PRODUCT_ID_GROWTH</code> (and{" "}
                  <code className="text-xs">POLAR_SERVER=sandbox|production</code>), then redeploy.
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
                  onClick={() => void startCheckout("starter")}
                  disabled={!polarConfigured || checkoutLoading !== null}
                >
                  {checkoutLoading === "starter" ? "Redirecting…" : "Subscribe — Starter"}
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
                  onClick={() => void startCheckout("growth")}
                  disabled={!polarConfigured || checkoutLoading !== null}
                >
                  {checkoutLoading === "growth" ? "Redirecting…" : "Subscribe — Growth"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
