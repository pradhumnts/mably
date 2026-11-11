/**
 * Polar Billing env (never log secrets).
 * Use sandbox tokens + sandbox product IDs with POLAR_SERVER=sandbox.
 * Production tokens/products are not interchangeable with sandbox.
 *
 * Seat-based team pricing (manual Polar dashboard setup):
 * - Convert Starter / Growth (and founding twins) to Pricing type: Seat-based
 *   at $9 / $19 per seat, with no extra fixed price on the product (Polar bills
 *   fixed + seat prices together).
 * - Founding twins: graduated tiers — seat 1 at $2.25 / $4.75, seats 2+ at
 *   $9 / $19. The founding discount covers the owner's seat only.
 * - Graduated/volume seat tiers are fine; the product must still be seat-based
 *   (`subscription.seats` non-null). Legacy fixed-price products cannot PATCH seats.
 * - Point POLAR_PRODUCT_ID_STARTER, POLAR_PRODUCT_ID_GROWTH,
 *   POLAR_PRODUCT_ID_STARTER_FOUNDING, POLAR_PRODUCT_ID_GROWTH_FOUNDING at those
 *   products (same POLAR_SERVER as the access token).
 * - Checkout sends seats:1 (owner). App syncs quantity to accepted member count;
 *   do not use Polar customerSeats.assign / Polar invite emails.
 * - Existing solo customers should stay at seats=1 so monthly total is unchanged.
 * - OAT needs subscriptions:read + subscriptions:write (seat PATCH). Missing write
 *   scope surfaces as insufficient_scope / 403 — not a payment-method issue.
 */

/**
 * Pin Polar API contract so requests don't silently follow "Current"
 * when Polar ships quarterly versions (first switch: 2026-10 on Oct 1).
 * @see https://polar.sh/docs
 */
export const POLAR_API_VERSION = "2026-04";

/**
 * Headers for Polar REST API calls (auth + pinned version).
 * @param {string} token
 * @param {{ json?: boolean }} [opts] — set json when sending a JSON body
 */
export function getPolarRequestHeaders(token, opts = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Polar-Version": POLAR_API_VERSION,
    ...(opts.json ? { "Content-Type": "application/json" } : {}),
  };
}

export function getPolarServer() {
  const raw =
    process.env.POLAR_SERVER?.trim().toLowerCase() ??
    process.env.NEXT_PUBLIC_POLAR_SERVER?.trim().toLowerCase() ??
    "sandbox";
  return raw === "production" ? "production" : "sandbox";
}

export function getPolarApiBase() {
  return getPolarServer() === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";
}

export function getPolarAccessToken() {
  return process.env.POLAR_ACCESS_TOKEN?.trim() ?? "";
}

/**
 * Token used for POST /v1/customer-sessions/ (customer portal).
 * Polar requires scope `customer_sessions:write` on the Organization Access Token.
 * If your main OAT cannot include that scope, set a dedicated token here.
 */
export function getPolarTokenForCustomerSessions() {
  return process.env.POLAR_CUSTOMER_SESSIONS_TOKEN?.trim() || getPolarAccessToken();
}

export function getPolarWebhookSecret() {
  return process.env.POLAR_WEBHOOK_SECRET?.trim() ?? "";
}

export function getPolarProductStarter() {
  return process.env.POLAR_PRODUCT_ID_STARTER?.trim() ?? "";
}

export function getPolarProductGrowth() {
  return process.env.POLAR_PRODUCT_ID_GROWTH?.trim() ?? "";
}

export function getPolarProductStarterFounding() {
  return process.env.POLAR_PRODUCT_ID_STARTER_FOUNDING?.trim() ?? "";
}

export function getPolarProductGrowthFounding() {
  return process.env.POLAR_PRODUCT_ID_GROWTH_FOUNDING?.trim() ?? "";
}

export function isFoundingPolarConfigured() {
  return Boolean(getPolarProductStarterFounding() && getPolarProductGrowthFounding());
}

/**
 * @param {"starter" | "growth"} plan
 * @param {{ founding?: boolean }} [opts]
 */
export function resolvePolarCheckoutProductId(plan, opts = {}) {
  const useFounding = opts.founding === true;
  if (plan === "growth") {
    return useFounding ? getPolarProductGrowthFounding() : getPolarProductGrowth();
  }
  return useFounding ? getPolarProductStarterFounding() : getPolarProductStarter();
}

/** Optional org UUID for list APIs if your token spans multiple orgs. */
export function getPolarOrganizationId() {
  return process.env.POLAR_ORGANIZATION_ID?.trim() ?? "";
}

/** Map Polar product id → plan key for app logic */
export function polarProductIdToPlanKey(productId) {
  if (!productId) return null;
  if (productId === getPolarProductStarter() || productId === getPolarProductStarterFounding()) {
    return "starter";
  }
  if (productId === getPolarProductGrowth() || productId === getPolarProductGrowthFounding()) {
    return "growth";
  }
  return null;
}
