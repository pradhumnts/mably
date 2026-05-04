"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const POLAR_PLAN_STARTER_FEATURES = [
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

export const POLAR_PLAN_GROWTH_FEATURES = [
  "Everything in Starter",
  "Unlimited projects",
  "50 GB storage · up to 2 GB per file",
  "Custom domain",
  "Hide Powered by tag",
  "Priority support",
];

function PlanCard({ title, description, price, features, cta, disabled, onClick, highlighted = false }) {
  return (
    <Card
      className={
        highlighted
          ? "relative flex flex-col border-orange-500/50 bg-gradient-to-b from-orange-50/80 via-card to-card shadow-md dark:from-orange-950/25 dark:via-card dark:to-card"
          : "flex flex-col border-border/80"
      }
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <p className="pt-2 text-3xl font-bold tracking-tight">{price}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              {f}
            </li>
          ))}
        </ul>
        <Button className="mt-auto w-full" onClick={onClick} disabled={disabled}>
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Starter / Growth grid + Polar checkout (no outer Dialog). Embed in another surface or use via {@link PolarPlanPickerDialog}.
 */
export function PolarPlanPickerContent({
  polarConfigured,
  currentPlanKey = null,
  className = "",
  /** When true, non-current plans use “Upgrade to …” (subscribed user). Otherwise “Subscribe — …”. */
  useUpgradeCtas = false,
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const startCheckout = useCallback(async (plan) => {
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
  }, []);

  const starterIsCurrent = currentPlanKey === "starter";
  const growthIsCurrent = currentPlanKey === "growth";
  const checkoutInFlight = checkoutLoading !== null;

  const starterCta =
    checkoutLoading === "starter"
      ? "Redirecting…"
      : starterIsCurrent
        ? "Current plan"
        : useUpgradeCtas
          ? "Upgrade to Starter"
          : "Subscribe — Starter";
  const growthCta =
    checkoutLoading === "growth"
      ? "Redirecting…"
      : growthIsCurrent
        ? "Current plan"
        : useUpgradeCtas
          ? "Upgrade to Growth"
          : "Subscribe — Growth";

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className}`.trim()}>
      <PlanCard
        title="Starter"
        description="$9/mo · try the workflow"
        price="$9"
        features={POLAR_PLAN_STARTER_FEATURES}
        cta={starterCta}
        onClick={() => void startCheckout("starter")}
        disabled={!polarConfigured || checkoutInFlight || starterIsCurrent}
      />
      <PlanCard
        title="Growth"
        description="$19/mo · full workspace"
        price="$19"
        features={POLAR_PLAN_GROWTH_FEATURES}
        cta={growthCta}
        onClick={() => void startCheckout("growth")}
        disabled={!polarConfigured || checkoutInFlight || growthIsCurrent}
        highlighted
      />
    </div>
  );
}

/**
 * Same plan picker as Settings → Subscription “Upgrade” (standalone Dialog).
 */
export function PolarPlanPickerDialog({
  open,
  onOpenChange,
  polarConfigured,
  currentPlanKey = null,
  useUpgradeCtas = false,
  title = "Choose your plan",
  description,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            typeof description === "string" ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <DialogDescription asChild>{description}</DialogDescription>
            )
          ) : null}
        </DialogHeader>
        <PolarPlanPickerContent
          polarConfigured={polarConfigured}
          currentPlanKey={currentPlanKey}
          useUpgradeCtas={useUpgradeCtas}
        />
      </DialogContent>
    </Dialog>
  );
}
