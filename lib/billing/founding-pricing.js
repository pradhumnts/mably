import { createAdminClient } from "@/lib/supabase/admin";
import { isPaidSubscriptionStatus } from "@/lib/billing/project-limits";
import {
  getPolarProductGrowthFounding,
  getPolarProductStarterFounding,
  isFoundingPolarConfigured,
} from "@/lib/billing/polar-env";
import { EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT } from "@/lib/billing/early-offer";

/**
 * @returns {string[]}
 */
export function getFoundingPolarProductIds() {
  return [getPolarProductStarterFounding(), getPolarProductGrowthFounding()].filter(Boolean);
}

/**
 * Count paid-like subscriptions on founding Polar products (by stored price_id / product id).
 * @returns {Promise<number>}
 */
export async function countFoundingSubscriptionsClaimed() {
  const productIds = getFoundingPolarProductIds();
  if (productIds.length === 0) return 0;

  const admin = createAdminClient();
  if (!admin) return 0;

  const { data, error } = await admin
    .from("freelancer_subscriptions")
    .select("price_id, status");

  if (error) {
    console.error("[founding] count subscriptions:", error.message);
    return 0;
  }

  const idSet = new Set(productIds);
  return (data ?? []).filter(
    (row) => idSet.has(String(row.price_id ?? "")) && isPaidSubscriptionStatus(row.status)
  ).length;
}

/**
 * @returns {Promise<{
 *   configured: boolean;
 *   available: boolean;
 *   claimed: number;
 *   remaining: number;
 *   limit: number;
 * }>}
 */
export async function getFoundingPricingState() {
  const limit = EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT;
  const configured = isFoundingPolarConfigured();

  if (!configured) {
    return { configured: false, available: false, claimed: 0, remaining: 0, limit };
  }

  const claimed = await countFoundingSubscriptionsClaimed();
  const remaining = Math.max(0, limit - claimed);

  return {
    configured: true,
    available: remaining > 0,
    claimed,
    remaining,
    limit,
  };
}
