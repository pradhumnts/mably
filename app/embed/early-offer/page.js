import { EarlyOfferEmbedClient } from "@/app/embed/early-offer/early-offer-embed-client";

export const metadata = {
  title: "Mably — Founding pricing",
  robots: { index: false, follow: false },
};

/**
 * Standalone, embeddable version of the early-pricing popup.
 *
 * Renders the same UI as the in-app dialog (see
 * `components/billing/early-pricing-offer/option-2-landscape.jsx`) but designed
 * to be hosted inside an iframe on the public Framer landing page.
 *
 * URL: /embed/early-offer
 *
 * Query params:
 *  - `mode=popup`  → renders with overlay + backdrop (default, used by loader script)
 *  - `mode=inline` → renders just the card (use when you want to embed inline in Framer)
 *
 * Loader script: `/embed/early-offer.js` (see public/embed/early-offer.js)
 */
export default function EarlyOfferEmbedPage({ searchParams }) {
  const mode = searchParams?.mode === "inline" ? "inline" : "popup";
  return <EarlyOfferEmbedClient mode={mode} />;
}
