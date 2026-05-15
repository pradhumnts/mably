"use client";

import {
  BrandGlowLandscape,
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
import { cn } from "@/lib/utils";
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";

const theme = "light";
const t = getEarlyOfferTheme(theme);

/**
 * Option 3 — landscape / desktop-friendly early-offer (light + Mably orange).
 */
export function EarlyPricingOfferDialogOption3({ open, onOpenChange, onNeverShowAgain }) {
  const {
    selectedPlan,
    setSelectedPlan,
    selectedPricing,
    handleClose,
    handleNeverShow,
    claimLoading,
    handleClaim,
  } = useEarlyOfferDialog({ onOpenChange, onNeverShowAgain });

  return (
    <EarlyOfferDialogFrame
      open={open}
      onOpenChange={onOpenChange}
      theme={theme}
      contentClassName="sm:max-w-[min(100vw-2rem,56rem)] lg:max-w-4xl"
    >
      <div className={cn("relative overflow-hidden", t.shell)}>
        <BrandGlowLandscape theme={theme} />
        <EarlyOfferCloseButton onClick={handleClose} theme={theme} />

        <div className="relative z-10 grid min-h-[min(22rem,70vh)] lg:grid-cols-[1fr_1.15fr]">
          <div
            className={cn(
              "flex flex-col justify-center border-b px-8 py-10 text-center lg:border-b-0 lg:border-r lg:px-10 lg:py-12 lg:text-left",
              t.divider
            )}
          >
            <EarlyOfferHeadline className="lg:text-left" theme={theme} />

            <div className="mt-8 flex flex-col items-center gap-4 lg:items-start">
              <DiscountHeroWithSparkles
                theme={theme}
                className="mx-auto lg:mx-0"
                cardClassName="min-h-[7rem] min-w-[11.5rem] px-8"
              />

              <div className="flex flex-wrap items-baseline justify-center gap-2 lg:justify-start">
                <span className={cn("text-xl", t.priceStrike)}>
                  ${selectedPricing.listPrice}/mo
                </span>
                <span className={cn("text-3xl font-bold tracking-tight", t.priceMain)}>
                  ${selectedPricing.display}
                  <span className={cn("text-lg font-semibold", t.priceSub)}>/mo</span>
                </span>
              </div>

              <EarlyOfferFoundingNote className="max-w-sm text-center lg:text-left" theme={theme} />

              <div className="mt-2 hidden w-full max-w-xs space-y-2 lg:block">
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", t.mutedFaint)}>
                  {EARLY_OFFER_COPY.planSummaryLabel}
                </p>
                <ul className={cn("space-y-1.5 text-sm", t.priceList)}>
                  {EARLY_OFFER_PLANS.map((plan) => {
                    const p = earlyOfferPrice(plan.listPriceMonthly);
                    return (
                      <li key={plan.key} className="flex justify-between gap-4">
                        <span>{plan.label}</span>
                        <span className={cn("tabular-nums", t.priceListValue)}>
                          <span className={cn("line-through", t.priceListStrike)}>
                            ${p.listPrice}
                          </span>{" "}
                          ${p.display}/mo
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <p className={cn("mb-4 w-full text-center text-sm lg:text-left", t.muted)}>
              {EARLY_OFFER_COPY.planPickerIntro}
            </p>

            <EarlyOfferPlanPicker
              theme={theme}
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              layout="stack"
              cardDirection="column"
            />

            <EarlyOfferClaimButton
              onClick={() => void handleClaim()}
              className="mt-6"
              theme={theme}
              loading={claimLoading}
              disabled={claimLoading}
            />

            <div className="mt-4 flex flex-col items-center gap-3 lg:items-start">
              <EarlyOfferFooterLinks
                onNeverShow={handleNeverShow}
                onDismiss={handleClose}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </EarlyOfferDialogFrame>
  );
}
