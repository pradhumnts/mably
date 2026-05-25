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
import { EARLY_OFFER_COPY } from "@/lib/billing/early-offer";
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";
import { NumberOdometer } from "@/components/number-odometer";
import { cn } from "@/lib/utils";

/**
 * Inner card used by both the in-app dialog and the embeddable popup.
 *
 * Keeps the exact layout, motion, sparkles, plan picker, claim CTA, and
 * footer links from the original popup; only the wrapping frame changes
 * (Dialog vs iframe / inline).
 *
 * @param {{
 *   active: boolean;
 *   selectedPlan: string;
 *   onSelectPlan: (key: string) => void;
 *   selectedPricing: { display: string; listPrice: number };
 *   onClose: () => void;
 *   onNeverShow: () => void;
 *   onClaim: () => void;
 *   claimLoading: boolean;
 *   landscapeBreakpoint?: "lg" | "md";
 * }} props
 */
export function EarlyPricingOfferCard({
  active,
  selectedPlan,
  onSelectPlan,
  selectedPricing,
  onClose,
  onNeverShow,
  onClaim,
  claimLoading,
  landscapeBreakpoint = "lg",
}) {
  const t = getEarlyOfferTheme("dark");
  const useMd = landscapeBreakpoint === "md";
  // Full static class strings so Tailwind's purge picks up every variant.
  const gridColsClass = useMd
    ? "md:grid-cols-[1fr_1.15fr]"
    : "lg:grid-cols-[1fr_1.15fr]";
  const heroColClass = useMd
    ? "border-b border-white/[0.06] px-8 py-10 text-center md:border-b-0 md:border-r md:px-10 md:py-12"
    : "border-b border-white/[0.06] px-8 py-10 text-center lg:border-b-0 lg:border-r lg:px-10 lg:py-12";
  const planColClass = useMd
    ? "px-6 py-8 sm:px-8 md:px-10 md:py-12"
    : "px-6 py-8 sm:px-8 lg:px-10 lg:py-12";

  return (
    <div className={cn("relative overflow-hidden", t.shell)}>
      <CelestialGlowLandscape />
      <EarlyOfferCloseButton onClick={onClose} />

      <div className={cn("relative z-10 grid min-h-[min(22rem,70vh)]", gridColsClass)}>
        {/* Left — hero */}
        <div className={cn("flex flex-col items-center justify-center", heroColClass)}>
          <EarlyOfferHeadline />

          <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-4">
            <DiscountHeroWithSparkles
              className="mx-auto"
              cardClassName="min-h-[7rem] min-w-[11.5rem] px-8"
              animateActive={active}
              animateDelay={0}
            />

            <div className="flex flex-wrap items-baseline justify-center gap-2">
              <span className="inline-flex items-baseline gap-0.5 text-xl text-white/45 line-through decoration-white/35">
                <NumberOdometer
                  active={active}
                  delay={0.14}
                  value={`$${selectedPricing.listPrice}`}
                  startValue={0}
                  duration={1.45}
                />
                <span>/mo</span>
              </span>
              <span className="inline-flex items-baseline gap-0.5 text-3xl font-bold tracking-tight text-white">
                <NumberOdometer
                  active={active}
                  delay={0.28}
                  value={`$${selectedPricing.display}`}
                  startValue={0}
                  duration={1.55}
                />
                <span className="text-lg font-semibold text-white/70">/mo</span>
              </span>
            </div>

            <EarlyOfferFoundingNote className="max-w-sm text-center" />
          </div>
        </div>

        {/* Right — plans + CTA */}
        <div className={cn("flex w-full flex-col items-center justify-center", planColClass)}>
          <div className="flex w-full max-w-md flex-col items-center">
            <p className="mb-4 w-full text-center text-sm text-white/50">
              {EARLY_OFFER_COPY.planPickerIntro}
            </p>

            <EarlyOfferPlanPicker
              selectedPlan={selectedPlan}
              onSelectPlan={onSelectPlan}
              layout="stack"
              cardDirection="column"
            />

            <EarlyOfferClaimButton
              onClick={onClaim}
              className="mt-6 w-full"
              loading={claimLoading}
              disabled={claimLoading}
            />

            <div className="mt-4 flex w-full flex-col items-center gap-3 text-center">
              <EarlyOfferFooterLinks onNeverShow={onNeverShow} onDismiss={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Early-pricing offer dialog — landscape / desktop-friendly layout.
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

  return (
    <EarlyOfferDialogFrame
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="sm:max-w-[min(100vw-2rem,56rem)] lg:max-w-4xl"
    >
      <EarlyPricingOfferCard
        active={open}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        selectedPricing={selectedPricing}
        onClose={handleClose}
        onNeverShow={handleNeverShow}
        onClaim={() => void handleClaim()}
        claimLoading={claimLoading}
      />
    </EarlyOfferDialogFrame>
  );
}
