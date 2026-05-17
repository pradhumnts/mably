import { GROWTH_LIBRARY_TOTAL_LABEL } from "@/lib/billing/library-storage-policy";
import { DEMO_PROJECT_ID } from "@/lib/data/demo-project";

/** Routes where the early-pricing offer may appear (freelancer home / main entry). */
export const EARLY_OFFER_MAIN_PATHS = ["/projects"];

/** Demo project portal entry (same as the projects list demo card). */
export const EARLY_OFFER_DEMO_PORTAL_HREF = `/project/${DEMO_PROJECT_ID}/dashboard`;

/** When set, the offer modal does not auto-open on visit/refresh; sticky CTA still works. */
export const EARLY_OFFER_SUPPRESS_AUTO_OPEN_KEY = "mably:early-offer:never";

export const EARLY_OFFER_DISCOUNT_PERCENT = 75;

/** Max freelancers who can claim founding pricing (copy only for now). */
export const EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT = 50;

/** @type {const} */
export const EARLY_OFFER_COPY = {
  headline: "EARLY PRICING · 50 SPOTS",
  foundingNote:
    "The first 50 signups get 75% off for life. You're in that window, but not for long. Claim it now so you don't pay full price later.",
  planBarLabel: "LOCK IN BEFORE IT'S GONE",
  planPickerIntro: "Claim your plan before spots run out.",
  claimCta: "Lock in my early pricing",
  footerNote: "Limited founding spots · Cancel anytime",
  exploreDemoPortal: "Explore a demo project portal",
  dialogTitle: "Early pricing for founding members",
  stickyCtaLabel: "Claim 75% off",
  stickyCtaSub: "Early Pricing · Only 50 Spots",
  settingsFoundingBanner:
    "Early pricing — 75% off locked in forever. Only for the first 50 founding members; when spots are gone, list pricing applies to new signups.",
  settingsCohortFull:
    "Founding pricing is full. New subscriptions are at standard list price; existing founding members keep their rate.",
};

/** Theme for the early-offer popup and sticky CTA. */
export function getEarlyOfferLayoutTheme() {
  return "dark";
}

/** @type {const} */
export const EARLY_OFFER_PLANS = [
  {
    key: "starter",
    label: "Starter",
    description: "1 active project · full client portal",
    listPriceMonthly: 9,
    features: ["Files & links", "Project chat", "1 GB storage"],
  },
  {
    key: "growth",
    label: "Growth",
    description: "Unlimited projects · custom domain",
    listPriceMonthly: 19,
    features: ["Everything in Starter", `${GROWTH_LIBRARY_TOTAL_LABEL} storage`, "Priority support"],
    recommended: true,
  },
];

/**
 * @param {number} listPrice
 * @param {number} [percent]
 */
export function earlyOfferPrice(listPrice, percent = EARLY_OFFER_DISCOUNT_PERCENT) {
  const discounted = listPrice * (1 - percent / 100);
  const rounded = Math.round(discounted * 100) / 100;
  const display =
    rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(2).replace(/\.?0+$/, "");
  return { listPrice, discounted: rounded, display };
}

/**
 * @param {string} pathname
 */
export function isEarlyOfferMainPath(pathname) {
  const path = String(pathname || "").split("?")[0];
  return EARLY_OFFER_MAIN_PATHS.includes(path);
}

/**
 * @returns {boolean}
 */
export function isEarlyOfferAutoOpenSuppressed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EARLY_OFFER_SUPPRESS_AUTO_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function suppressEarlyOfferAutoOpen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EARLY_OFFER_SUPPRESS_AUTO_OPEN_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
