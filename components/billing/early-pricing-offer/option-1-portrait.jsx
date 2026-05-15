"use client";

import {
  CelestialGlowPortrait,
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
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";
import { cn } from "@/lib/utils";

export function EarlyPricingOfferDialogOption1({ open, onOpenChange, onNeverShowAgain }) {
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
      contentClassName="sm:max-w-[min(100vw-1.5rem,26rem)]"
    >
      <div className={cn("relative overflow-hidden", t.shellPortrait)}>
        <CelestialGlowPortrait />
        <EarlyOfferCloseButton onClick={handleClose} />

        <div className="relative z-10 px-6 pb-7 pt-14 text-center sm:px-8">
          <EarlyOfferHeadline />

          <DiscountHeroWithSparkles
            className="mx-auto mt-8 max-w-[17rem]"
            cardClassName="min-h-[7.5rem] min-w-[11.5rem]"
          />

          <div className="mt-8 flex flex-wrap items-baseline justify-center gap-2">
            <span className="text-lg text-white/45 line-through decoration-white/35">
              ${selectedPricing.listPrice}/mo
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">
              ${selectedPricing.display}/mo
            </span>
          </div>

          <EarlyOfferFoundingNote className="mx-auto mt-4 max-w-[18rem] text-center" />

          <div className="mt-8 w-full">
            <EarlyOfferPlanPicker
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              layout="stack"
            />
          </div>

          <EarlyOfferClaimButton
            onClick={() => void handleClaim()}
            className="mt-6"
            loading={claimLoading}
            disabled={claimLoading}
          />

          <div className="mt-4 flex flex-col items-center gap-3">
            <EarlyOfferFooterLinks onNeverShow={handleNeverShow} onDismiss={handleClose} />
          </div>
        </div>
      </div>
    </EarlyOfferDialogFrame>
  );
}
