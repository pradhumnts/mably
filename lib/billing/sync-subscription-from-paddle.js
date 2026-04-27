import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdToPlanKey } from "@/lib/billing/paddle-env";

function primaryPriceIdFromSubscription(sub) {
  const items = sub?.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const first = items[0];
  return first?.price?.id ?? first?.price_id ?? null;
}

function periodEndFromSubscription(sub) {
  const period = sub?.current_billing_period ?? sub?.currentBillingPeriod;
  const ends =
    period?.ends_at ??
    period?.endsAt ??
    sub?.next_billed_at ??
    sub?.nextBilledAt ??
    null;
  return ends ?? null;
}

/**
 * Upsert freelancer subscription row from Paddle subscription payload.
 * @param {{ subscription: object, explicitUserId?: string | null }} args
 */
export async function upsertFreelancerSubscriptionFromPaddle(args) {
  const admin = createAdminClient();
  if (!admin) {
    console.error("[paddle] SUPABASE_SERVICE_ROLE_KEY missing — cannot persist subscription");
    return { ok: false, error: "admin_client_unconfigured" };
  }

  const sub = args.subscription;
  if (!sub?.id || !sub.customer_id) {
    return { ok: false, error: "invalid_subscription_payload" };
  }

  let userId =
    args.explicitUserId ??
    sub.custom_data?.supabase_user_id ??
    sub.custom_data?.supabaseUserId ??
    null;

  if (!userId) {
    const { data: existing } = await admin
      .from("freelancer_subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", sub.id)
      .maybeSingle();
    userId = existing?.user_id ?? null;
  }

  if (!userId) {
    console.warn("[paddle] No user id for subscription — pass customData.supabase_user_id at checkout", sub.id);
    return { ok: false, error: "missing_user_id" };
  }

  const priceId = primaryPriceIdFromSubscription(sub);
  const planKey = priceIdToPlanKey(priceId);
  const status = (sub.status ?? "unknown").toLowerCase();
  const periodEnd = periodEndFromSubscription(sub);
  const cancelAtEnd = Boolean(
    sub.cancel_at_period_end ?? sub.cancelAtPeriodEnd ?? false
  );

  const row = {
    user_id: userId,
    paddle_customer_id: sub.customer_id,
    paddle_subscription_id: sub.id,
    status,
    price_id: priceId,
    plan_key: planKey,
    current_period_end: periodEnd,
    cancel_at_period_end: cancelAtEnd,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("freelancer_subscriptions").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("[paddle] upsert freelancer_subscriptions:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
