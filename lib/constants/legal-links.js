import { marketingPath } from "@/lib/site-urls";

/**
 * Legal pages live on the marketing host (mably.io).
 * Override individual URLs via env if needed.
 */
export const LEGAL_LINKS = {
  terms:
    process.env.NEXT_PUBLIC_LEGAL_TERMS_URL?.trim() ||
    marketingPath("/legal/terms-conditions"),
  privacy:
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL?.trim() ||
    marketingPath("/legal/privacy-policy"),
  refund:
    process.env.NEXT_PUBLIC_LEGAL_REFUND_URL?.trim() ||
    marketingPath("/legal/refund-policy"),
  cookies:
    process.env.NEXT_PUBLIC_LEGAL_COOKIES_URL?.trim() ||
    marketingPath("/legal/cookie-policy"),
};
