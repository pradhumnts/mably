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
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  EARLY_OFFER_COPY,
  EARLY_OFFER_DISCOUNT_PERCENT,
  EARLY_OFFER_PLANS,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";
import {
  GROWTH_LIBRARY_MAX_FILE_LABEL,
  GROWTH_LIBRARY_TOTAL_LABEL,
} from "@/lib/billing/library-storage-policy";
import { startPolarCheckout } from "@/lib/client/start-polar-checkout";
import { cn } from "@/lib/utils";

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
  `${GROWTH_LIBRARY_TOTAL_LABEL} storage · up to ${GROWTH_LIBRARY_MAX_FILE_LABEL} per file`,
  "Custom domain",
  "Hide Powered by tag",
  "Priority support",
];

function planPricing(planKey, useFounding) {
  const plan = EARLY_OFFER_PLANS.find((p) => p.key === planKey) ?? EARLY_OFFER_PLANS[0];
  const founding = earlyOfferPrice(plan.listPriceMonthly);
  return {
    listPrice: founding.listPrice,
    displayPrice: useFounding ? founding.display : String(founding.listPrice),
  };
}

/**
 * @param {{
 *   title: string;
 *   description: string;
 *   listPrice: number;
 *   displayPrice: string;
 *   founding?: boolean;
 *   features: string[];
 *   cta: string;
 *   disabled: boolean;
 *   onClick: () => void;
 *   highlighted?: boolean;
 * }} props
 */
function PlanCard({
  title,
  description,
  listPrice,
  displayPrice,
  founding = false,
  features,
  cta,
  disabled,
  onClick,
  highlighted = false,
}) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        founding && "overflow-visible",
        highlighted
          ? "relative border-orange-500/50 bg-gradient-to-b from-orange-50/80 via-card to-card shadow-md dark:from-orange-950/25 dark:via-card dark:to-card"
          : "border-border/80"
      )}
    >
      <CardHeader className={founding ? "gap-2.5" : undefined}>
        {founding ? (
          <div className="flex justify-center md:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
              Early pricing
            </span>
          </div>
        ) : null}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-2">
          {founding ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                ${listPrice}/mo
              </span>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                ${displayPrice}
                <span className="text-base font-semibold text-muted-foreground">/mo</span>
              </span>
            </div>
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              ${displayPrice}
              <span className="text-base font-semibold text-muted-foreground">/mo</span>
            </p>
          )}
          {founding ? (
            <p className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
              {EARLY_OFFER_DISCOUNT_PERCENT}% off locked in forever
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              <span className="flex flex-wrap items-center gap-2">
                <span>{f}</span>
                {f.toLowerCase().includes("custom domain") ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/50 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700 shadow-sm dark:border-orange-700/40 dark:bg-orange-950/40 dark:text-orange-200">
                    <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                    Coming soon
                  </span>
                ) : null}
              </span>
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
 * @typedef {{
 *   configured: boolean;
 *   available: boolean;
 *   claimed: number;
 *   remaining: number;
 *   limit: number;
 * }} FoundingPricingState
 */

/**
 * @param {{
 *   polarConfigured: boolean;
 *   currentPlanKey?: string | null;
 *   className?: string;
 *   useUpgradeCtas?: boolean;
 *   foundingPricing?: FoundingPricingState | null;
 *   preferFoundingCheckout?: boolean;
 *   defaultPlan?: "starter" | "growth" | null;
 * }} props
 */
export function PolarPlanPickerContent({
  polarConfigured,
  currentPlanKey = null,
  className = "",
  useUpgradeCtas = false,
  foundingPricing = null,
  preferFoundingCheckout = false,
  defaultPlan = null,
}) {
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const useFounding =
    Boolean(foundingPricing?.configured && foundingPricing?.available) && !useUpgradeCtas;

  const startCheckout = useCallback(
    async (plan) => {
      setCheckoutLoading(plan);
      try {
        await startPolarCheckout({ plan, founding: useFounding });
      } catch (e) {
        toast.error(e?.message ?? "Checkout failed");
      } finally {
        setCheckoutLoading(null);
      }
    },
    [useFounding]
  );

  const starterIsCurrent = currentPlanKey === "starter";
  const growthIsCurrent = currentPlanKey === "growth";
  const checkoutInFlight = checkoutLoading !== null;

  const foundingCtaSuffix = useFounding ? " (early pricing)" : "";

  const starterCta =
    checkoutLoading === "starter"
      ? "Redirecting…"
      : starterIsCurrent
        ? "Current plan"
        : useUpgradeCtas
          ? "Upgrade to Starter"
          : `Subscribe — Starter${foundingCtaSuffix}`;
  const growthCta =
    checkoutLoading === "growth"
      ? "Redirecting…"
      : growthIsCurrent
        ? "Current plan"
        : useUpgradeCtas
          ? "Upgrade to Growth"
          : `Subscribe — Growth${foundingCtaSuffix}`;

  const starterPrices = planPricing("starter", useFounding);
  const growthPrices = planPricing("growth", useFounding);

  return (
    <div className={cn("space-y-4", className)}>
      {useFounding && foundingPricing ? (
        <div className="rounded-lg border border-orange-200/80 bg-gradient-to-r from-orange-50/90 via-white to-violet-50/50 px-4 py-3 dark:border-orange-500/25 dark:from-orange-950/30 dark:via-card dark:to-violet-950/20">
          <p className="text-sm font-medium text-foreground">{EARLY_OFFER_COPY.settingsFoundingBanner}</p>
        </div>
      ) : foundingPricing?.configured && !foundingPricing.available ? (
        <div className="rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">{EARLY_OFFER_COPY.settingsCohortFull}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-6 md:grid-cols-2",
          useFounding && "pt-1",
          defaultPlan === "growth" && "md:[&>*:last-child]:ring-2 md:[&>*:last-child]:ring-orange-500/40",
          defaultPlan === "starter" && "md:[&>*:first-child]:ring-2 md:[&>*:first-child]:ring-orange-500/40"
        )}
      >
        <PlanCard
          title="Starter"
          description={useFounding ? "Early pricing · 1 active project" : "$9/mo · try the workflow"}
          listPrice={starterPrices.listPrice}
          displayPrice={starterPrices.displayPrice}
          founding={useFounding}
          features={POLAR_PLAN_STARTER_FEATURES}
          cta={starterCta}
          onClick={() => void startCheckout("starter")}
          disabled={!polarConfigured || checkoutInFlight || starterIsCurrent}
        />
        <PlanCard
          title="Growth"
          description={useFounding ? "Early pricing · unlimited projects" : "$19/mo · full workspace"}
          listPrice={growthPrices.listPrice}
          displayPrice={growthPrices.displayPrice}
          founding={useFounding}
          features={POLAR_PLAN_GROWTH_FEATURES}
          cta={growthCta}
          onClick={() => void startCheckout("growth")}
          disabled={!polarConfigured || checkoutInFlight || growthIsCurrent}
          highlighted
        />
      </div>
    </div>
  );
}

export function PolarPlanPickerDialog({
  open,
  onOpenChange,
  polarConfigured,
  currentPlanKey = null,
  useUpgradeCtas = false,
  foundingPricing = null,
  preferFoundingCheckout = false,
  defaultPlan = null,
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
          foundingPricing={foundingPricing}
          preferFoundingCheckout={preferFoundingCheckout}
          defaultPlan={defaultPlan}
        />
      </DialogContent>
    </Dialog>
  );
}
