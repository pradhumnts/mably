"use server";

import { createClient } from "@/lib/supabase/server";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/push/vapid-config";

/**
 * @param {unknown} subscription
 */
function parsePushSubscription(subscription) {
  if (!subscription || typeof subscription !== "object") return null;
  const s = /** @type {Record<string, unknown>} */ (subscription);
  const endpoint = typeof s.endpoint === "string" ? s.endpoint.trim() : "";
  const keys =
    s.keys && typeof s.keys === "object"
      ? /** @type {Record<string, unknown>} */ (s.keys)
      : null;
  const p256dh = keys && typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = keys && typeof keys.auth === "string" ? keys.auth.trim() : "";
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

export async function getWebPushPublicKey() {
  return {
    ok: true,
    configured: isWebPushConfigured(),
    publicKey: getVapidPublicKey(),
  };
}

/**
 * @param {{
 *   subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
 *   userAgent?: string | null;
 * }} fields
 */
export async function savePushSubscription(fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const parsed = parsePushSubscription(fields.subscription);
  if (!parsed) {
    return { ok: false, error: "Invalid push subscription" };
  }

  const user_agent =
    typeof fields.userAgent === "string" ? fields.userAgent.trim().slice(0, 500) : null;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.p256dh,
      auth: parsed.auth,
      user_agent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** How many browser endpoints are registered for the signed-in user. */
export async function getPushSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in", count: 0 };
  }

  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message, count: 0 };
  }

  return { ok: true, count: count ?? 0 };
}

/**
 * @param {string} endpoint
 */
export async function removePushSubscription(endpoint) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const ep = typeof endpoint === "string" ? endpoint.trim() : "";
  if (!ep) {
    return { ok: false, error: "Missing endpoint" };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", ep);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
