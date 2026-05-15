"use client";

import { Sparkles } from "lucide-react";
import { EARLY_OFFER_COPY, getEarlyOfferLayoutTheme } from "@/lib/billing/early-offer";
import { getEarlyOfferTheme } from "@/lib/billing/early-offer-theme";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom-right CTA to reopen the early-pricing offer on main paths.
 *
 * @param {{ onClick: () => void; className?: string }} props
 */
export function EarlyPricingOfferStickyCta({ onClick, className }) {
  const theme = getEarlyOfferLayoutTheme();
  const t = getEarlyOfferTheme(theme);
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-[90] max-w-[min(calc(100vw-3rem),17rem)] cursor-pointer rounded-full p-[1px] text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isLight
          ? "early-offer-sticky-light focus-visible:ring-orange-400 focus-visible:ring-offset-white"
          : "early-offer-sticky-dark focus-visible:ring-white/40 focus-visible:ring-offset-[#050508]",
        t.stickyFabBorder,
        className
      )}
      aria-label={`${EARLY_OFFER_COPY.stickyCtaLabel} — ${EARLY_OFFER_COPY.stickyCtaSub}`}
    >
      <span
        className={cn(
          "flex items-center gap-3 rounded-full py-2.5 pl-3 pr-4",
          t.stickyFabInner
        )}
      >
        <span
          className={cn(
            "early-offer-sparkle-pulse flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            t.stickyFabAccent
          )}
          aria-hidden
        >
          <Sparkles className={cn("h-4 w-4", isLight ? "text-white" : "text-black/80")} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-bold tracking-tight">{EARLY_OFFER_COPY.stickyCtaLabel}</span>
          <span
            className={cn(
              "mt-0.5 block text-[10px] font-semibold tracking-[0.15em]",
              t.stickyFabSub
            )}
          >
            {EARLY_OFFER_COPY.stickyCtaSub}
          </span>
        </span>
      </span>
    </button>
  );
}
