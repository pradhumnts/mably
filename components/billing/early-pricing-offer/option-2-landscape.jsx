"use client";

import {
  CelestialGlowLandscape,
  DiscountHeroWithSparkles,
  EarlyOfferClaimButton,
  EarlyOfferCloseButton,
  EarlyOfferDialogFrame,
  EarlyOfferFooterLinks,
  EarlyOfferPlanPicker,
  EarlyOfferFoundingNote,
  EarlyOfferHeadline,
  useEarlyOfferDialog,
} from "@/components/billing/early-pricing-offer/early-offer-shared";
import { EARLY_OFFER_COPY, EARLY_OFFER_PLANS, earlyOfferPrice } from "@/lib/billing/early-offer";
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";
import { cn } from "@/lib/utils";

/**
 * Option 2 — landscape / desktop-friendly early-offer layout.
 *
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onNeverShowAgain?: () => void;
 * }} props
 */
export function EarlyPricingOfferDialogOption2({ open, onOpenChange, onNeverShowAgain }) {
  const {
    selectedPlan,
    setSelectedPlan,
    selectedPricing,
    handleClose,
    handleNeverShow,
    claimLoading,
    handleClaim,
  } = useEarlyOfferDialog({ onOpenChange, onNeverShowAgain });

  const t = getEarlyOfferTheme("dark");

  return (
    <EarlyOfferDialogFrame
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="sm:max-w-[min(100vw-2rem,56rem)] lg:max-w-4xl"
    >
      <div className={cn("relative overflow-hidden", t.shell)}>
        <CelestialGlowLandscape />
        <EarlyOfferCloseButton onClick={handleClose} />

        <div className="relative z-10 grid min-h-[min(22rem,70vh)] lg:grid-cols-[1fr_1.15fr]">
          {/* Left — hero */}
          <div className="flex flex-col justify-center border-b border-white/[0.06] px-8 py-10 text-center lg:border-b-0 lg:border-r lg:px-10 lg:py-12 lg:text-left">
            <EarlyOfferHeadline className="lg:text-left" />

            <div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
              <DiscountHeroWithSparkles
                className="mx-auto lg:mx-0"
                cardClassName="min-h-[7rem] min-w-[11.5rem] px-8"
              />

              <div className="flex flex-wrap items-baseline justify-center gap-2 lg:justify-start">
                <span className="text-xl text-white/45 line-through decoration-white/35">
                  ${selectedPricing.listPrice}/mo
                </span>
                <span className="text-3xl font-bold tracking-tight text-white">
                  ${selectedPricing.display}
                  <span className="text-lg font-semibold text-white/70">/mo</span>
                </span>
              </div>

              <EarlyOfferFoundingNote className="max-w-sm text-center lg:text-left" />

              <div className="mt-2 hidden w-full max-w-xs space-y-2 lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {EARLY_OFFER_COPY.planSummaryLabel}
                </p>
                <ul className="space-y-1.5 text-sm text-white/50">
                  {EARLY_OFFER_PLANS.map((plan) => {
                    const p = earlyOfferPrice(plan.listPriceMonthly);
                    return (
                      <li key={plan.key} className="flex justify-between gap-4">
                        <span>{plan.label}</span>
                        <span className="tabular-nums text-white/80">
                          <span className="text-white/35 line-through">${p.listPrice}</span>{" "}
                          ${p.display}/mo
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Right — plans + CTA */}
          <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <p className="mb-4 w-full text-center text-sm text-white/50 lg:text-left">
              {EARLY_OFFER_COPY.planPickerIntro}
            </p>

            <EarlyOfferPlanPicker
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              layout="stack"
              cardDirection="column"
            />

            <EarlyOfferClaimButton
              onClick={() => void handleClaim()}
              className="mt-6"
              loading={claimLoading}
              disabled={claimLoading}
            />

            <div className="mt-4 flex flex-col items-center gap-3 lg:items-start">
              <EarlyOfferFooterLinks onNeverShow={handleNeverShow} onDismiss={handleClose} />
            </div>
          </div>
        </div>
      </div>
    </EarlyOfferDialogFrame>
  );
}
