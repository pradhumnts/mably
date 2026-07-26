import { createAdminClient } from "@/lib/supabase/admin";
import {
  upsertFreelancerSubscriptionFromPolar,
  userIdFromPolarPayload,
} from "@/lib/billing/sync-subscription-from-polar";

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

/**
 * Allow Polar to retry a delivery that failed after we claimed the event id.
 * @param {string | null} deliveryId
 */
async function releasePolarEvent(deliveryId) {
  if (!deliveryId) return;
  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from("polar_webhook_events")
    .delete()
    .eq("event_id", deliveryId);
  if (error) {
    console.error("[polar] webhook event release:", error.message);
  }
}

function subscriptionFromOrderLike(data) {
  if (!data || typeof data !== "object") return null;
  return (
    data.subscription ??
    (data.subscription_id || data.subscriptionId
      ? {
          id: data.subscription_id ?? data.subscriptionId,
          customer_id: data.customer_id ?? data.customerId ?? data.customer?.id,
          customer: data.customer,
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
      const result = await upsertFreelancerSubscriptionFromPolar({
        subscription: data,
        explicitUserId: null,
      });
      if (!result.ok) {
        await releasePolarEvent(deliveryId);
        return { ok: false, error: result.error ?? "upsert_failed" };
      }
      return { ok: true };
    }

    if (type === "order.paid" || type === "order.created") {
      const sub = subscriptionFromOrderLike(data);
      if (sub?.id && (sub.customer_id || sub.customer?.id)) {
        const uid = userIdFromPolarPayload(data, null);
        const result = await upsertFreelancerSubscriptionFromPolar({
          subscription: {
            ...sub,
            metadata: data.metadata ?? sub.metadata,
            customer: data.customer ?? sub.customer,
          },
          explicitUserId: uid,
        });
        if (!result.ok) {
          await releasePolarEvent(deliveryId);
          return { ok: false, error: result.error ?? "upsert_failed" };
        }
      }
      return { ok: true };
    }

    return { ok: true, ignored: true, eventType: type };
  } catch (e) {
    console.error("[polar] webhook handler:", e);
    await releasePolarEvent(deliveryId);
    return { ok: false, error: String(e?.message ?? e) };
  }
}
