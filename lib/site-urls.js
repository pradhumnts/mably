/**
 * Public origins for marketing (mably.io) vs app (app.mably.io).
 * Uses NEXT_PUBLIC_* so values are available in client components.
 */

function trimOrigin(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

/**
 * Product app — auth, billing, invites, client portals.
 * Keep NEXT_PUBLIC_SITE_URL aligned with this in production (app.mably.io).
 */
export function getAppOrigin() {
  return (
    trimOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    trimOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    ""
  );
}

/** Marketing site — landing and future www pages. */
export function getMarketingOrigin() {
  return trimOrigin(process.env.NEXT_PUBLIC_MARKETING_URL) || getAppOrigin() || "";
}

/** Absolute URL on the app host (falls back to relative path in local dev). */
export function appPath(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getAppOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}

/** Absolute URL on the marketing host. */
export function marketingPath(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getMarketingOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}
