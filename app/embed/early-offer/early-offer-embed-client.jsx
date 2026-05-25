"use client";

import { useEffect, useMemo, useState } from "react";
import { EarlyPricingOfferCard } from "@/components/billing/early-pricing-offer/option-2-landscape";
import {
  EARLY_OFFER_PLANS,
  EARLY_OFFER_DEMO_PORTAL_HREF,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";

/**
 * Messages sent from the iframe to the parent (Framer) loader script.
 * Loader filters by `source: "mably-early-offer"`.
 */
const EMBED_MESSAGE_SOURCE = "mably-early-offer";

/**
 * Resolve the public app origin for cross-window redirects.
 * Falls back to the iframe location's origin if unset.
 */
function getAppOrigin() {
  if (typeof window === "undefined") return "";
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return envOrigin || window.location.origin;
}

/**
 * @param {{ mode: "popup" | "inline" }} props
 */
export function EarlyOfferEmbedClient({ mode }) {
  const [selectedPlan, setSelectedPlan] = useState(
    () => EARLY_OFFER_PLANS.find((p) => p.recommended)?.key ?? "growth"
  );
  const [claimLoading, setClaimLoading] = useState(false);
  const [active, setActive] = useState(false);

  // Trigger entrance animations after mount (so number odometer + sparkles play).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setActive(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const selected = useMemo(
    () => EARLY_OFFER_PLANS.find((p) => p.key === selectedPlan) ?? EARLY_OFFER_PLANS[0],
    [selectedPlan]
  );

  const selectedPricing = useMemo(
    () => earlyOfferPrice(selected.listPriceMonthly),
    [selected]
  );

  /**
   * @param {{ kind: "close" | "never-show" | "navigate"; href?: string }} payload
   */
  const sendToParent = (payload) => {
    if (typeof window === "undefined") return;
    try {
      window.parent?.postMessage(
        { source: EMBED_MESSAGE_SOURCE, ...payload },
        "*"
      );
    } catch {
      /* parent might be cross-origin; postMessage is still safe */
    }
  };

  const handleClose = () => {
    sendToParent({ kind: "close" });
  };

  const handleNeverShow = () => {
    sendToParent({ kind: "never-show" });
  };

  const handleClaim = () => {
    setClaimLoading(true);
    const planKey = selectedPlan === "starter" ? "starter" : "growth";
    const target = `${getAppOrigin()}/signup?founding=1&plan=${planKey}`;
    sendToParent({ kind: "navigate", href: target });
    try {
      window.top.location.href = target;
    } catch {
      window.location.href = target;
    }
  };

  // Demo portal link is rendered inside the card; intercept clicks so they
  // navigate the top window instead of just the iframe.
  useEffect(() => {
    const handler = (e) => {
      const anchor = e.target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      const absolute = href.startsWith("http")
        ? href
        : `${getAppOrigin()}${href.startsWith("/") ? href : `/${href}`}`;
      sendToParent({ kind: "navigate", href: absolute });
      try {
        window.top.location.href = absolute;
      } catch {
        window.location.href = absolute;
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // The demo link defaults to a relative app route — pre-compute its absolute URL
  // so the loader script doesn't have to know about it.
  useEffect(() => {
    const links = document.querySelectorAll(`a[href="${EARLY_OFFER_DEMO_PORTAL_HREF}"]`);
    links.forEach((node) => {
      node.setAttribute("href", `${getAppOrigin()}${EARLY_OFFER_DEMO_PORTAL_HREF}`);
      node.setAttribute("target", "_top");
    });
  }, []);

  // Render the card flush to the iframe edges — no padding, no centering
  // wrapper, no extra width. The host (Framer, etc.) sizes the iframe to the
  // popup itself. The inline style below kills the in-app card's outer glow
  // + drop shadow so the visible footprint is exactly the rounded card.
  return (
    <>
      <style>{`
        .mably-embed-popup-root,
        .mably-embed-popup-root > div {
          width: 100%;
          height: 100%;
        }
        .mably-embed-popup-root > div {
          box-shadow: none !important;
        }
      `}</style>
      <div className="mably-embed-popup-root" data-embed-mode={mode}>
        <EarlyPricingOfferCard
          active={active}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          selectedPricing={selectedPricing}
          onClose={handleClose}
          onNeverShow={handleNeverShow}
          onClaim={handleClaim}
          claimLoading={claimLoading}
        />
      </div>
    </>
  );
}
