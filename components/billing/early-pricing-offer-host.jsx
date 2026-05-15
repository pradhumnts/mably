"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { EarlyPricingOfferDialog } from "@/components/billing/early-pricing-offer-dialog";
import { EarlyPricingOfferStickyCta } from "@/components/billing/early-pricing-offer-sticky-cta";
import {
  isEarlyOfferAutoOpenSuppressed,
  isEarlyOfferMainPath,
} from "@/lib/billing/early-offer";

/**
 * Shows the early-pricing offer on configured main paths for users without a subscription.
 * Close = hidden until next visit/refresh; "Don't show again" stops auto-open only (sticky remains).
 *
 * @param {{ hasSubscription: boolean }} props
 */
export function EarlyPricingOfferHost({ hasSubscription }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const onMainPath = isEarlyOfferMainPath(pathname);
  const shouldShowOfferChrome = !hasSubscription && onMainPath;

  const tryAutoOpenOffer = useCallback(() => {
    if (!shouldShowOfferChrome) {
      setOpen(false);
      return;
    }
    if (isEarlyOfferAutoOpenSuppressed()) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [shouldShowOfferChrome]);

  useEffect(() => {
    tryAutoOpenOffer();
  }, [tryAutoOpenOffer, pathname]);

  const handleOpenChange = (next) => {
    setOpen(next);
  };

  const handleSuppressAutoOpen = () => {
    setOpen(false);
  };

  const showSticky = shouldShowOfferChrome && !open;

  if (!shouldShowOfferChrome) {
    return null;
  }

  return (
    <>
      <EarlyPricingOfferDialog
        open={open}
        onOpenChange={handleOpenChange}
        onNeverShowAgain={handleSuppressAutoOpen}
      />
      {showSticky ? <EarlyPricingOfferStickyCta onClick={() => setOpen(true)} /> : null}
    </>
  );
}
