/**
 * Polar Billing env (never log secrets).
 * Use sandbox tokens + sandbox product IDs with POLAR_SERVER=sandbox.
 */

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

export function getPolarWebhookSecret() {
  return process.env.POLAR_WEBHOOK_SECRET?.trim() ?? "";
}

export function getPolarProductStarter() {
  return process.env.POLAR_PRODUCT_ID_STARTER?.trim() ?? "";
}

export function getPolarProductGrowth() {
  return process.env.POLAR_PRODUCT_ID_GROWTH?.trim() ?? "";
}

/** Optional org UUID for list APIs if your token spans multiple orgs. */
export function getPolarOrganizationId() {
  return process.env.POLAR_ORGANIZATION_ID?.trim() ?? "";
}

/** Map Polar product id → plan key for app logic */
export function polarProductIdToPlanKey(productId) {
  if (!productId) return null;
  if (productId === getPolarProductStarter()) return "starter";
  if (productId === getPolarProductGrowth()) return "growth";
  return null;
}
