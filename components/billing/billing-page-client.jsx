"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  PolarPlanPickerContent,
  PolarPlanPickerDialog,
} from "@/components/billing/polar-plan-picker-dialog";

function formatUtcDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Subscription / Polar billing UI (used from Settings → Subscription).
 * @param {{
 *   polarConfigured: boolean;
 *   initialSubscription: object | null;
 *   canReconcile?: boolean;
 *   onSubscriptionSynced?: () => void;
 *   foundingPricing?: { configured: boolean; available: boolean; claimed: number; remaining: number; limit: number } | null;
 *   preferFoundingCheckout?: boolean;
 *   checkoutPlan?: "starter" | "growth" | null;
 * }} props
 */
export function BillingPageClient({
  polarConfigured,
  initialSubscription,
  canReconcile = false,
  onSubscriptionSynced,
  foundingPricing = null,
  preferFoundingCheckout = false,
  checkoutPlan = null,
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState(initialSubscription);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [portalScopeHelpOpen, setPortalScopeHelpOpen] = useState(false);
  const [portalScopeHelp, setPortalScopeHelp] = useState({ docsUrl: "", requiredScope: "" });

  useEffect(() => {
    setSubscription(initialSubscription);
  }, [initialSubscription]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "insufficient_scope") {
          setPortalScopeHelp({
            docsUrl: json.docs_url ?? "https://polar.sh/docs/integrate/oat",
            requiredScope: json.required_scope ?? "customer_sessions:write",
          });
          setPortalScopeHelpOpen(true);
          throw new Error(
            "Your Polar token needs the customer_sessions:write scope to open the customer portal."
          );
        }
        throw new Error(json.error ?? "Could not open portal");
      }
      window.location.href = json.url;
    } catch (e) {
      toast.error(e?.message ?? "Portal session failed");
    } finally {
      setPortalLoading(false);
    }
  };

  const refreshFromPolar = async () => {
    setReconcileLoading(true);
    try {
      const res = await fetch("/api/billing/reconcile", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not refresh");
      setSubscription(json.subscription ?? null);
      onSubscriptionSynced?.();
      toast.success(json.synced ? "Subscription synced from Polar." : "No active subscription found in Polar.");
    } catch (e) {
      toast.error(e?.message ?? "Refresh failed");
    } finally {
      setReconcileLoading(false);
    }
  };

  const canManage = Boolean(subscription);
  const currentPlan = subscription?.plan_key ?? null;
  const isSubscribed = Boolean(subscription);
  const formattedPeriodEnd = formatUtcDate(subscription?.current_period_end);

  return (
    <>
      <div className="space-y-8">
        {!polarConfigured ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Configure Polar</CardTitle>
              <CardDescription>
                Set server env <code className="text-xs">POLAR_ACCESS_TOKEN</code>,{" "}
                <code className="text-xs">POLAR_WEBHOOK_SECRET</code>,{" "}
                <code className="text-xs">POLAR_PRODUCT_ID_STARTER</code>,{" "}
                <code className="text-xs">POLAR_PRODUCT_ID_GROWTH</code>,{" "}
                <code className="text-xs">POLAR_PRODUCT_ID_STARTER_FOUNDING</code>, and{" "}
                <code className="text-xs">POLAR_PRODUCT_ID_GROWTH_FOUNDING</code> (and{" "}
                <code className="text-xs">POLAR_SERVER=sandbox|production</code>), then redeploy.
                When creating the Organization Access Token in Polar, include the{" "}
                <code className="text-xs">customer_sessions:write</code> scope so “Manage
                subscription” can open the customer portal. Optionally set{" "}
                <code className="text-xs">POLAR_CUSTOMER_SESSIONS_TOKEN</code> to a token that has
                only that scope if you split tokens.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {subscription ? (
          <div className="space-y-3">
            <div className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium leading-none">Current subscription</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  Plan:{" "}
                  <span className="font-medium text-foreground">{subscription.plan_key ?? "—"}</span>{" "}
                  · Status:{" "}
                  <span className="font-medium text-foreground">{subscription.status}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {canReconcile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void refreshFromPolar()}
                    disabled={reconcileLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${reconcileLoading ? "animate-spin" : ""}`} />
                    {reconcileLoading ? "Syncing…" : "Refresh from Polar"}
                  </Button>
                ) : null}
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
                <Button size="sm" onClick={() => setUpgradeModalOpen(true)} disabled={!polarConfigured}>
                  {isSubscribed ? "Upgrade" : "Choose a plan"}
                </Button>
              </div>
            </div>
            {formattedPeriodEnd ? (
              <p className="text-xs text-muted-foreground">Current period ends: {formattedPeriodEnd}</p>
            ) : null}
          </div>
        ) : canReconcile ? (
          <div className="flex flex-row flex-wrap items-start justify-between gap-4">

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void refreshFromPolar()}
              disabled={reconcileLoading}
            >
              <RefreshCw className={`h-4 w-4 ${reconcileLoading ? "animate-spin" : ""}`} />
              {reconcileLoading ? "Syncing…" : "Refresh billing status"}
            </Button>
          </div>
        ) : null}

        {!isSubscribed && polarConfigured ? (
          <div className="overflow-visible">
          <PolarPlanPickerContent
            polarConfigured={polarConfigured}
            currentPlanKey={null}
            useUpgradeCtas={false}
            foundingPricing={foundingPricing}
            preferFoundingCheckout={preferFoundingCheckout}
            defaultPlan={checkoutPlan}
          />
          </div>
        ) : null}
      </div>

      <Dialog open={portalScopeHelpOpen} onOpenChange={setPortalScopeHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Polar customer portal</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  Polar returned <strong>insufficient_scope</strong>. The token your server uses must
                  include <code className="text-xs">{portalScopeHelp.requiredScope}</code> to create a
                  customer session.
                </p>
                <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
                  <li>Open Polar → your organization → Settings → Developers.</li>
                  <li>Create a new Organization Access Token (or replace the old one).</li>
                  <li>
                    Enable scope <code className="text-xs">{portalScopeHelp.requiredScope}</code>{" "}
                    (and keep scopes needed for checkout, e.g. checkouts).
                  </li>
                  <li>
                    Set <code className="text-xs">POLAR_ACCESS_TOKEN</code> to the new value (or set{" "}
                    <code className="text-xs">POLAR_CUSTOMER_SESSIONS_TOKEN</code> for portal only) and
                    redeploy.
                  </li>
                </ol>
                <p>
                  <a
                    href={portalScopeHelp.docsUrl || "https://polar.sh/docs/integrate/oat"}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Polar docs: Organization Access Tokens
                  </a>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <PolarPlanPickerDialog
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        polarConfigured={polarConfigured}
        currentPlanKey={currentPlan}
        useUpgradeCtas={isSubscribed}
        foundingPricing={foundingPricing}
        preferFoundingCheckout={false}
        defaultPlan={checkoutPlan}
        title="Upgrade your plan"
        description={
          currentPlan
            ? `You are currently on the ${currentPlan} plan.`
            : "Choose the plan that fits your workload."
        }
      />

    </>
  );
}
