import { createAdminClient } from "@/lib/supabase/admin";
import { polarProductIdToPlanKey } from "@/lib/billing/polar-env";

function productIdFromPolarSubscription(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.product_id ??
    data.productId ??
    data.product?.id ??
    data.price?.product_id ??
    data.price?.productId ??
    null
  );
}

/**
 * Extract supabase_user_id-style ids from a Polar metadata object.
 * @param {unknown} meta
 * @returns {string | null}
 */
function userIdFromMetadata(meta) {
  if (!meta || typeof meta !== "object") return null;
  const m =
    meta.supabase_user_id ??
    meta.supabaseUserId ??
    meta.user_id ??
    meta.userId ??
    null;
  return m ? String(m) : null;
}

/**
 * Resolve our Supabase user id from a Polar subscription / order payload.
 *
 * Polar maps checkout `external_customer_id` onto `customer.external_id`
 * (not a top-level `external_customer_id` on subscription webhooks).
 * Checkout `metadata` may also be present; `customer_metadata` lands on
 * `customer.metadata`.
 *
 * @param {object | null | undefined} data
 * @param {string | null | undefined} explicitUserId
 * @returns {string | null}
 */
export function userIdFromPolarPayload(data, explicitUserId) {
  if (explicitUserId) return String(explicitUserId);

  const fromMeta = userIdFromMetadata(data?.metadata);
  if (fromMeta) return fromMeta;

  const customer = data?.customer;
  if (customer && typeof customer === "object") {
    const fromCustomerMeta = userIdFromMetadata(customer.metadata);
    if (fromCustomerMeta) return fromCustomerMeta;

    const ext = customer.external_id ?? customer.externalId ?? null;
    if (ext) return String(ext);
  }

  // Fallbacks for checkout-shaped / older payloads
  const topExt = data?.external_customer_id ?? data?.externalCustomerId ?? null;
  if (topExt) return String(topExt);

  return null;
}

/** @deprecated use userIdFromPolarPayload */
function userIdFromPolarSubscription(data, explicitUserId) {
  return userIdFromPolarPayload(data, explicitUserId);
}

function periodEndFromPolar(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.current_period_end ??
    data.currentPeriodEnd ??
    data.current_period_end_at ??
    null
  );
}

/**
 * Upsert freelancer subscription row from a Polar subscription object (webhook `data`).
 * @param {{ subscription: object, explicitUserId?: string | null }} args
 */
export async function upsertFreelancerSubscriptionFromPolar(args) {
  const admin = createAdminClient();
  if (!admin) {
    console.error("[polar] SUPABASE_SERVICE_ROLE_KEY missing — cannot persist subscription");
    return { ok: false, error: "admin_client_unconfigured" };
  }

  const sub = args.subscription;
  if (!sub?.id) {
    return { ok: false, error: "invalid_subscription_payload" };
  }

  const customerId =
    sub.customer_id ?? sub.customerId ?? sub.customer?.id ?? null;
  if (!customerId) {
    return { ok: false, error: "missing_customer_id" };
  }

  let userId = userIdFromPolarSubscription(sub, args.explicitUserId ?? null);

  if (!userId) {
    const { data: existing } = await admin
      .from("freelancer_subscriptions")
      .select("user_id")
      .eq("polar_subscription_id", String(sub.id))
      .maybeSingle();
    userId = existing?.user_id ?? null;
  }

  if (!userId && customerId) {
    const { data: byCustomer } = await admin
      .from("freelancer_subscriptions")
      .select("user_id")
      .eq("polar_customer_id", String(customerId))
      .maybeSingle();
    userId = byCustomer?.user_id ?? null;
  }

  if (!userId) {
    console.warn(
      "[polar] No user id for subscription — expected customer.external_id or metadata.supabase_user_id",
      sub.id
    );
    return { ok: false, error: "missing_user_id" };
  }

  const productId = productIdFromPolarSubscription(sub);
  const planKey = polarProductIdToPlanKey(productId);
  const status = String(sub.status ?? "unknown").toLowerCase();
  const periodEnd = periodEndFromPolar(sub);
  const cancelAtEnd = Boolean(sub.cancel_at_period_end ?? sub.cancelAtPeriodEnd ?? false);
  const priceId = sub.price_id ?? sub.priceId ?? sub.price?.id ?? null;

  const row = {
    user_id: userId,
    polar_customer_id: String(customerId),
    polar_subscription_id: String(sub.id),
    status,
    price_id: priceId ? String(priceId) : productId ? String(productId) : null,
    plan_key: planKey,
    current_period_end: periodEnd,
    cancel_at_period_end: cancelAtEnd,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("freelancer_subscriptions").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("[polar] upsert freelancer_subscriptions:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
