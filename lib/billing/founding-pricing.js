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
 * Whether a freelancer_subscriptions row is on a founding Polar product.
 * Legacy rows may only have the product id in price_id (older sync fallback).
 * @param {{ polar_product_id?: string | null; price_id?: string | null } | null | undefined} row
 * @returns {boolean}
 */
export function isFoundingSubscriptionRow(row) {
  const ids = new Set(getFoundingPolarProductIds());
  if (ids.size === 0 || !row) return false;
  return (
    ids.has(String(row.polar_product_id ?? "")) || ids.has(String(row.price_id ?? ""))
  );
}

/**
 * Count paid-like subscriptions on founding Polar products.
 * @returns {Promise<number>}
 */
export async function countFoundingSubscriptionsClaimed() {
  if (getFoundingPolarProductIds().length === 0) return 0;

  const admin = createAdminClient();
  if (!admin) return 0;

  const { data, error } = await admin
    .from("freelancer_subscriptions")
    .select("price_id, polar_product_id, status");

  if (error) {
    console.error("[founding] count subscriptions:", error.message);
    return 0;
  }

  return (data ?? []).filter(
    (row) => isFoundingSubscriptionRow(row) && isPaidSubscriptionStatus(row.status)
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
