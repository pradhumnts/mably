import { createAdminClient } from "@/lib/supabase/admin";
import { upsertFreelancerSubscriptionFromPolar } from "@/lib/billing/sync-subscription-from-polar";

/**
 * @param {string | null} deliveryId
 * @returns {Promise<boolean|null>} true inserted, false duplicate, null skip
 */
async function insertPolarEventOnce(deliveryId) {
  if (!deliveryId) return true;
  const admin = createAdminClient();
  if (!admin) return null;

  const { error } = await admin.from("polar_webhook_events").insert({ event_id: deliveryId });

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[polar] webhook event dedupe insert:", error.message);
  return null;
}

function subscriptionFromOrderLike(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.subscription ??
    (data.subscription_id || data.subscriptionId
      ? {
          id: data.subscription_id ?? data.subscriptionId,
          customer_id: data.customer_id ?? data.customerId,
          status: "active",
          metadata: data.metadata,
          product_id: data.product_id ?? data.productId,
        }
      : null)
  );
}

/**
 * @param {object} event - Verified Polar webhook payload (`type` + `data`)
 * @param {string | null} deliveryId - Unique delivery id for deduplication (e.g. Webhook-Id header)
 */
export async function processPolarWebhookEvent(event, deliveryId) {
  const type = event?.type ?? event?.event;
  const data = event?.data ?? {};

  if (!type) {
    return { ok: false, error: "missing_event_type" };
  }

  const dedupe = await insertPolarEventOnce(deliveryId);
  if (dedupe === false) {
    return { ok: true, skipped: true, reason: "duplicate_event" };
  }

  try {
    if (typeof type === "string" && type.startsWith("subscription.")) {
      await upsertFreelancerSubscriptionFromPolar({ subscription: data, explicitUserId: null });
      return { ok: true };
    }

    if (type === "order.paid" || type === "order.created") {
      const sub = subscriptionFromOrderLike(data);
      if (sub?.id && sub.customer_id) {
        const uid = userIdFromOrderPayload(data);
        await upsertFreelancerSubscriptionFromPolar({
          subscription: { ...sub, metadata: data.metadata ?? sub.metadata },
          explicitUserId: uid,
        });
      }
      return { ok: true };
    }

    return { ok: true, ignored: true, eventType: type };
  } catch (e) {
    console.error("[polar] webhook handler:", e);
    return { ok: false, error: String(e?.message ?? e) };
  }
}

function userIdFromOrderPayload(data) {
  const meta = data?.metadata;
  if (meta && typeof meta === "object") {
    const m =
      meta.supabase_user_id ??
      meta.supabaseUserId ??
      meta.user_id ??
      meta.userId ??
      null;
    if (m) return String(m);
  }
  const ext = data?.external_customer_id ?? data?.externalCustomerId;
  if (ext) return String(ext);
  return null;
}
