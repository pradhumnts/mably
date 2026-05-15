"use client";

import { EARLY_OFFER_LAYOUT_VARIANT } from "@/lib/billing/early-offer";
import { EarlyPricingOfferDialogOption1 } from "@/components/billing/early-pricing-offer/option-1-portrait";
import { EarlyPricingOfferDialogOption2 } from "@/components/billing/early-pricing-offer/option-2-landscape";
import { EarlyPricingOfferDialogOption3 } from "@/components/billing/early-pricing-offer/option-3-light-landscape";

/**
 * Early-pricing offer modal. Layout is controlled by {@link EARLY_OFFER_LAYOUT_VARIANT}:
 * - `option-1` — portrait (mobile-first, dark)
 * - `option-2` — landscape (desktop-friendly, dark) — default
 * - `option-3` — landscape (desktop-friendly, light / Mably brand)
 *
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onNeverShowAgain?: () => void;
 * }} props
 */
export function EarlyPricingOfferDialog(props) {
  if (EARLY_OFFER_LAYOUT_VARIANT === "option-1") {
    return <EarlyPricingOfferDialogOption1 {...props} />;
  }
  if (EARLY_OFFER_LAYOUT_VARIANT === "option-3") {
    return <EarlyPricingOfferDialogOption3 {...props} />;
  }
  return <EarlyPricingOfferDialogOption2 {...props} />;
}
