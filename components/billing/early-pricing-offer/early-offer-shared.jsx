"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { startPolarCheckout } from "@/lib/client/start-polar-checkout";
import { Check, Sparkles, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  EARLY_OFFER_COPY,
  EARLY_OFFER_DEMO_PORTAL_HREF,
  EARLY_OFFER_DISCOUNT_PERCENT,
  EARLY_OFFER_PLANS,
  suppressEarlyOfferAutoOpen,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";
import { NumberOdometer } from "@/components/number-odometer";

/**
 * @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; className?: string; horizontal?: boolean }} props
 */
export function OfferSparkles({ theme = "dark", className, horizontal = false }) {
  const t = getEarlyOfferTheme(theme);
  const stars = [0, 1, 2].map((i) => (
    <Sparkles
      key={i}
      className={cn(
        t.sparkle,
        horizontal ? "h-4 w-4" : "h-3.5 w-3.5",
        i === 1 && (horizontal ? "h-5 w-5" : "h-4 w-4") && t.sparkleMid,
        i === 0 && "opacity-70"
      )}
    />
  ));

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        horizontal ? "gap-3" : "flex-col gap-3 py-1",
        className
      )}
      aria-hidden
    >
      {stars}
    </div>
  );
}

export function CelestialGlowPortrait() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className="relative -mt-28 h-56 w-[min(100%,28rem)]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(251,191,36,0.45) 0%, rgba(59,130,246,0.35) 38%, transparent 72%)",
        }}
      />
      <div
        className="absolute top-2 h-32 w-32 rounded-full opacity-80 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(30,58,138,0.2) 55%, transparent 70%)",
        }}
      />
    </div>
  );
}


/** @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme }} props */
export function BrandGlowLandscape({ theme = "dark" }) {
  if (theme === "light") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(249,115,22,0.28) 0%, rgba(251,146,60,0.08) 55%, transparent 70%)",
          }}
        />
        <div
          className="absolute -right-12 -top-12 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-48 w-full max-w-lg -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse 90% 100% at 50% 0%, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }
  return <CelestialGlowLandscape />;
}

export function CelestialGlowLandscape() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(30,58,138,0.15) 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute left-1/3 top-0 h-40 w-[min(100%,32rem)] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(251,191,36,0.2) 0%, rgba(59,130,246,0.15) 45%, transparent 75%)",
        }}
      />
    </div>
  );
}

/** @param {{ active: boolean; theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme }} props */
function PlanSelectIndicator({ active, theme = "dark" }) {
  const t = getEarlyOfferTheme(theme);
  return active ? (
    <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center self-center rounded-full", t.indicatorActive)}>
      <Check className="h-3 w-3" strokeWidth={3} />
    </div>
  ) : (
    <div className={cn("h-5 w-5 shrink-0 self-center rounded-full border", t.indicatorIdle)} />
  );
}

/** @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; className?: string }} props */
export function DiscountHeroCard({ theme = "dark", className, animateActive = false, animateDelay = 0 }) {
  const t = getEarlyOfferTheme(theme);
  const discountLabel = `${EARLY_OFFER_DISCOUNT_PERCENT}% OFF`;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl px-6 py-5",
        t.discountCard,
        className
      )}
    >
      <p className="text-[2.35rem] font-bold leading-none tracking-tight lg:text-[2.75rem]">
        {animateActive ? (
          <NumberOdometer
            active={animateActive}
            delay={animateDelay}
            value={discountLabel}
            startValue={0}
            duration={1.75}
            className="inline-flex"
          />
        ) : (
          discountLabel
        )}
      </p>
      <p className={cn("mt-2 text-sm font-semibold tracking-[0.2em]", t.discountForever)}>FOREVER</p>
    </div>
  );
}

/**
 * @param {{
 *   selectedPlan: string;
 *   onSelectPlan: (key: string) => void;
 *   layout?: "stack" | "grid";
 *   cardDirection?: "row" | "column";
 *   theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme;
 * }} props
 */
export function EarlyOfferPlanPicker({
  selectedPlan,
  onSelectPlan,
  layout = "stack",
  cardDirection = "row",
  theme = "dark",
}) {
  const t = getEarlyOfferTheme(theme);
  const isColumnCard = cardDirection === "column";
  return (
    <div className={cn("w-full overflow-hidden rounded-xl", t.planPickerShell)}>
      <div
        className={cn(
          "bg-gradient-to-r px-3 py-2 text-center text-[10px] font-bold tracking-[0.22em]",
          t.planBar
        )}
      >
        {EARLY_OFFER_COPY.planBarLabel}
      </div>
      <div
        className={cn(
          "p-3",
          t.planWell,
          layout === "grid" ? "grid gap-2.5 sm:grid-cols-2" : "flex flex-col gap-2.5"
        )}
      >
        {EARLY_OFFER_PLANS.map((plan) => {
          const pricing = earlyOfferPrice(plan.listPriceMonthly);
          const active = selectedPlan === plan.key;
          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => onSelectPlan(plan.key)}
              className={cn(
                "w-full rounded-xl p-[1px] text-left transition-transform active:scale-[0.99]",
                active ? t.planBorderActive : t.planBorderIdle
              )}
            >
              <div
                className={cn(
                  "rounded-[11px] px-4 py-3.5",
                  active ? t.planInner : t.planInnerIdle,
                  "flex items-center gap-4"
                )}
              >
                {isColumnCard ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-sm font-semibold", t.planTitle)}>{plan.label}</span>
                        {plan.recommended ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", t.planBadge)}>
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("mt-1 text-xs leading-relaxed", t.planDesc)}>{plan.description}</p>
                    </div>
                    <div className="flex min-w-[5.25rem] shrink-0 flex-col items-end gap-0.5 text-right">
                      <p className={cn("text-lg font-bold tabular-nums leading-none", t.planPrice)}>${pricing.display}/mo</p>
                      <p className={cn("text-xs tabular-nums line-through", t.planPriceStrike)}>${pricing.listPrice}/mo</p>
                    </div>
                    <PlanSelectIndicator active={active} theme={theme} />
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", t.planTitle)}>{plan.label}</span>
                        {plan.recommended ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", t.planBadge)}>
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("mt-0.5 text-xs", t.planDesc)}>{plan.description}</p>
                    </div>
                    <div className="flex min-w-[4.5rem] shrink-0 flex-col items-end gap-0.5 text-right">
                      <p className={cn("text-sm font-semibold tabular-nums leading-none", t.planPrice)}>
                        ${pricing.display}/mo
                      </p>
                      <p className={cn("text-[11px] tabular-nums line-through", t.planPriceStrike)}>
                        ${pricing.listPrice}/mo
                      </p>
                    </div>
                    <PlanSelectIndicator active={active} theme={theme} />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; cardClassName?: string; className?: string; animateActive?: boolean; animateDelay?: number }} props */
export function DiscountHeroWithSparkles({
  theme = "dark",
  cardClassName,
  className,
  animateActive = false,
  animateDelay = 0,
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2 sm:gap-3", className)}>
      <OfferSparkles theme={theme} />
      <DiscountHeroCard
        theme={theme}
        className={cardClassName}
        animateActive={animateActive}
        animateDelay={animateDelay}
      />
      <OfferSparkles theme={theme} />
    </div>
  );
}

/** @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; className?: string }} props */
export function EarlyOfferHeadline({ theme = "dark", className }) {
  const t = getEarlyOfferTheme(theme);
  return (
    <p className={cn("text-[11px] font-semibold tracking-[0.35em]", t.headline, className)}>
      {EARLY_OFFER_COPY.headline}
    </p>
  );
}

/** @param {{ theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; className?: string }} props */
export function EarlyOfferFoundingNote({ theme = "dark", className }) {
  const t = getEarlyOfferTheme(theme);
  return (
    <p className={cn("text-sm leading-relaxed", t.body, className)}>
      {EARLY_OFFER_COPY.foundingNote}
    </p>
  );
}

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onNeverShowAgain?: () => void;
 *   contentClassName?: string;
 *   theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme;
 *   children: React.ReactNode;
 * }} props
 */
export function EarlyOfferDialogFrame({
  open,
  onOpenChange,
  children,
  contentClassName,
  theme = "dark",
}) {
  const t = getEarlyOfferTheme(theme);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={cn("z-[100]", t.overlay)} />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            "fixed top-1/2 left-1/2 z-[101] max-h-[min(96vh,920px)] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200",
            contentClassName
          )}
        >
          <DialogTitle className="sr-only">{EARLY_OFFER_COPY.dialogTitle}</DialogTitle>
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

/**
 * @param {{
 *   onOpenChange: (open: boolean) => void;
 *   onNeverShowAgain?: () => void;
 * }} props
 */
export function useEarlyOfferDialog({ onOpenChange, onNeverShowAgain }) {
  const [selectedPlan, setSelectedPlan] = useState(
    () => EARLY_OFFER_PLANS.find((p) => p.recommended)?.key ?? "growth"
  );
  const [claimLoading, setClaimLoading] = useState(false);

  const selected = useMemo(
    () => EARLY_OFFER_PLANS.find((p) => p.key === selectedPlan) ?? EARLY_OFFER_PLANS[0],
    [selectedPlan]
  );

  const selectedPricing = useMemo(
    () => earlyOfferPrice(selected.listPriceMonthly),
    [selected]
  );

  const handleClose = () => onOpenChange(false);

  const handleNeverShow = () => {
    suppressEarlyOfferAutoOpen();
    onNeverShowAgain?.();
    onOpenChange(false);
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      await startPolarCheckout({
        plan: selectedPlan === "starter" ? "starter" : "growth",
        founding: true,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message ?? "Checkout failed");
    } finally {
      setClaimLoading(false);
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    selected,
    selectedPricing,
    claimLoading,
    handleClose,
    handleNeverShow,
    handleClaim,
  };
}

/** @param {{ onClick: () => void; theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme }} props */
export function EarlyOfferCloseButton({ onClick, theme = "dark" }) {
  const t = getEarlyOfferTheme(theme);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
        t.close
      )}
      aria-label="Close offer"
    >
      <X className="h-5 w-5" />
    </button>
  );
}

/** @param {{ onClick: () => void; className?: string; theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme; disabled?: boolean; loading?: boolean }} props */
export function EarlyOfferClaimButton({
  onClick,
  className,
  theme = "dark",
  disabled = false,
  loading = false,
}) {
  const t = getEarlyOfferTheme(theme);
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full cursor-pointer rounded-full p-[1px] text-base font-bold transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        isLight ? "early-offer-border-light" : "early-offer-border-dark",
        t.ctaBorder,
        className
      )}
    >
      <span className={cn("block w-full rounded-full px-6 py-3.5", t.ctaInner)}>
        {loading ? "Redirecting to checkout…" : EARLY_OFFER_COPY.claimCta}
      </span>
    </button>
  );
}

/** @param {{ onNeverShow: () => void; onDismiss?: () => void; theme?: import("@/lib/billing/early-offer-theme").EarlyOfferTheme }} props */
export function EarlyOfferFooterLinks({ onNeverShow, onDismiss, theme = "dark" }) {
  const t = getEarlyOfferTheme(theme);
  return (
    <>
      <p className={cn("text-center text-xs", t.footer)}>{EARLY_OFFER_COPY.footerNote}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
        <Link
          href={EARLY_OFFER_DEMO_PORTAL_HREF}
          onClick={() => onDismiss?.()}
          className={cn("underline-offset-2 transition hover:underline", t.footerLink)}
        >
          {EARLY_OFFER_COPY.exploreDemoPortal}
        </Link>
        <span className={cn("hidden sm:inline", t.footer)} aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={onNeverShow}
          className={cn("underline-offset-2 transition hover:underline", t.footerLink)}
        >
          Don&apos;t show this again
        </button>
      </div>
    </>
  );
}
