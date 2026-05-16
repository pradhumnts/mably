"use client";

import { EarlyPricingOfferDialogOption2 } from "@/components/billing/early-pricing-offer/option-2-landscape";

/**
 * Early-pricing offer modal (landscape layout).
 *
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   onNeverShowAgain?: () => void;
 * }} props
 */
export function EarlyPricingOfferDialog(props) {
  return <EarlyPricingOfferDialogOption2 {...props} />;
}
