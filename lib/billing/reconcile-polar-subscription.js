import {
  getPolarAccessToken,
  getPolarApiBase,
  getPolarOrganizationId,
} from "@/lib/billing/polar-env";
import { upsertFreelancerSubscriptionFromPolar } from "@/lib/billing/sync-subscription-from-polar";

function subscriptionRank(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "active") return 4;
  if (s === "trialing") return 3;
  if (s === "past_due") return 2;
  if (s === "canceled" || s === "cancelled") return 0;
  return 1;
}

/**
 * Pull the latest subscription(s) from Polar for this user (external_customer_id = Supabase user id)
 * and upsert into freelancer_subscriptions. Use when webhooks are delayed or not configured.
 *
 * @param {string} userId
 * @returns {Promise<{ ok: boolean; synced?: boolean; error?: string }>}
 */
export async function reconcilePolarSubscriptionForUser(userId) {
  const token = getPolarAccessToken();
  if (!token || !userId) {
    return { ok: false, error: "missing_token_or_user" };
  }

  const base = getPolarApiBase();
  const url = new URL(`${base}/subscriptions/`);
  url.searchParams.set("external_customer_id", String(userId));
  url.searchParams.set("limit", "25");

  const orgId = getPolarOrganizationId();
  if (orgId) {
    url.searchParams.set("organization_id", orgId);
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (e) {
    console.error("[polar] reconcile fetch:", e);
    return { ok: false, error: "fetch_failed" };
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    console.error("[polar] reconcile invalid JSON:", text.slice(0, 200));
    return { ok: false, error: "invalid_response" };
  }

  if (!res.ok) {
    console.error("[polar] reconcile list subscriptions:", res.status, json);
    return { ok: false, error: json.detail?.[0]?.msg ?? json.message ?? `http_${res.status}` };
  }

  const items = Array.isArray(json.items) ? json.items : [];
  if (items.length === 0) {
    return { ok: true, synced: false };
  }

  const sorted = [...items].sort(
    (a, b) => subscriptionRank(b.status) - subscriptionRank(a.status)
  );

  const activeLike = sorted.filter((s) => {
    const st = String(s.status ?? "").toLowerCase();
    return st === "active" || st === "trialing" || st === "past_due";
  });

  const chosen = (activeLike.length > 0 ? activeLike : sorted)[0];
  const r = await upsertFreelancerSubscriptionFromPolar({
    subscription: chosen,
    explicitUserId: String(userId),
  });

  if (!r.ok) {
    return { ok: false, error: r.error ?? "upsert_failed" };
  }

  return { ok: true, synced: true };
}
