/**
 * Marketing site legal pages (Framer). Override via env per deploy if URLs change.
 */
export const LEGAL_LINKS = {
  terms:
    process.env.NEXT_PUBLIC_LEGAL_TERMS_URL?.trim() ||
    "https://mably.io/legal/terms-conditions",
  privacy:
    process.env.NEXT_PUBLIC_LEGAL_PRIVACY_URL?.trim() ||
    "https://mably.io/legal/privacy-policy",
  refund:
    process.env.NEXT_PUBLIC_LEGAL_REFUND_URL?.trim() ||
    "https://mably.io/legal/refund-policy",
};
