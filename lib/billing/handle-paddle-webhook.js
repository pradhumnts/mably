import { createAdminClient } from "@/lib/supabase/admin";
import { upsertFreelancerSubscriptionFromPaddle } from "@/lib/billing/sync-subscription-from-paddle";

/** @returns {Promise<boolean|null>} true if inserted, false if duplicate, null if skipped (no admin) */
async function insertEventOnce(eventId) {
  if (!eventId) return true;
  const admin = createAdminClient();
  if (!admin) return null;

  const { error } = await admin.from("paddle_webhook_events").insert({ event_id: eventId });

  if (!error) return true;

  if (error.code === "23505") return false;
  console.error("[paddle] webhook event dedupe insert:", error.message);
  return null;
}

function transactionToSyntheticSubscription(txn) {
  const lineItems = txn.details?.line_items ?? txn.line_items ?? [];
  const items = Array.isArray(lineItems)
    ? lineItems.map((li) => ({
        price: { id: li.price?.id ?? li.price_id },
      }))
    : [];

  return {
    id: txn.subscription_id ?? txn.subscriptionId,
    customer_id: txn.customer_id ?? txn.customerId,
    status: "active",
    items,
    custom_data: txn.custom_data ?? txn.customData ?? {},
    current_billing_period: null,
    cancel_at_period_end: false,
  };
}

/**
 * @param {object} envelope - Parsed webhook JSON (event_id, event_type, data)
 */
export async function processPaddleWebhookEvent(envelope) {
  const eventId = envelope.event_id ?? envelope.eventId;
  const eventType = envelope.event_type ?? envelope.eventType;
  const data = envelope.data ?? {};

  if (!eventType) {
    return { ok: false, error: "missing_event_type" };
  }

  const dedupe = await insertEventOnce(eventId);
  if (dedupe === false) {
    return { ok: true, skipped: true, reason: "duplicate_event" };
  }

  try {
    if (eventType.startsWith("subscription.")) {
      await upsertFreelancerSubscriptionFromPaddle({
        subscription: data,
        explicitUserId: null,
      });
      return { ok: true };
    }

    if (eventType === "transaction.completed") {
      const uid =
        data.custom_data?.supabase_user_id ??
        data.custom_data?.supabaseUserId ??
        null;
      const subId = data.subscription_id ?? data.subscriptionId;
      if (uid && subId) {
        const synthetic = transactionToSyntheticSubscription(data);
        if (synthetic.id && synthetic.customer_id) {
          await upsertFreelancerSubscriptionFromPaddle({
            subscription: synthetic,
            explicitUserId: uid,
          });
        }
      }
      return { ok: true };
    }

    return { ok: true, ignored: true, eventType };
  } catch (e) {
    console.error("[paddle] webhook handler:", e);
    return { ok: false, error: String(e?.message ?? e) };
  }
}
