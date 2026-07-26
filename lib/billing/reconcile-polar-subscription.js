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
 * @param {string} token
 * @param {string} url
 * @param {{ method?: string; body?: object }} [opts]
 */
async function polarRequest(token, url, opts = {}) {
  const method = opts.method ?? "GET";
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
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
    console.error("[polar] reconcile request:", res.status, method, url, json);
    return {
      ok: false,
      error: json.detail?.[0]?.msg ?? json.message ?? `http_${res.status}`,
      status: res.status,
      json,
    };
  }

  return { ok: true, json };
}

/**
 * @param {object[]} items
 */
function chooseSubscription(items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => subscriptionRank(b.status) - subscriptionRank(a.status)
  );

  const activeLike = sorted.filter((s) => {
    const st = String(s.status ?? "").toLowerCase();
    return st === "active" || st === "trialing" || st === "past_due";
  });

  return (activeLike.length > 0 ? activeLike : sorted)[0] ?? null;
}

/**
 * @param {object} sub
 * @param {object | null} customer
 * @param {string} userId
 */
function enrichSubscription(sub, customer, userId) {
  const customerId =
    sub.customer_id ?? sub.customerId ?? customer?.id ?? null;
  return {
    ...sub,
    customer_id: customerId,
    customer: sub.customer ?? {
      id: customerId,
      external_id: customer?.external_id ?? customer?.externalId ?? userId,
      metadata: customer?.metadata ?? { supabase_user_id: userId },
    },
  };
}

/**
 * @param {string} token
 * @param {string} userId
 */
async function listSubscriptionsByExternalCustomerId(token, userId) {
  const base = getPolarApiBase();
  const url = new URL(`${base}/subscriptions/`);
  url.searchParams.set("external_customer_id", String(userId));
  url.searchParams.set("limit", "25");

  const orgId = getPolarOrganizationId();
  if (orgId) {
    url.searchParams.set("organization_id", orgId);
  }

  const r = await polarRequest(token, url.toString());
  if (!r.ok) return r;
  const items = Array.isArray(r.json.items) ? r.json.items : [];
  return { ok: true, items };
}

/**
 * @param {string} token
 * @param {string} customerId
 */
async function listSubscriptionsByCustomerId(token, customerId) {
  const base = getPolarApiBase();
  const url = new URL(`${base}/subscriptions/`);
  url.searchParams.set("customer_id", String(customerId));
  url.searchParams.set("limit", "25");

  const orgId = getPolarOrganizationId();
  if (orgId) {
    url.searchParams.set("organization_id", orgId);
  }

  const r = await polarRequest(token, url.toString());
  if (!r.ok) return r;
  const items = Array.isArray(r.json.items) ? r.json.items : [];
  return { ok: true, items };
}

/**
 * @param {string} token
 * @param {string} userId
 */
async function customerStateByExternalId(token, userId) {
  const base = getPolarApiBase();
  const url = `${base}/customers/external/${encodeURIComponent(String(userId))}/state`;
  const r = await polarRequest(token, url);
  if (!r.ok) {
    if (r.status === 404) return { ok: true, items: [], customer: null };
    return r;
  }

  const items = Array.isArray(r.json.active_subscriptions)
    ? r.json.active_subscriptions
    : Array.isArray(r.json.activeSubscriptions)
      ? r.json.activeSubscriptions
      : [];

  const customer = {
    id: r.json.id ?? r.json.customer_id ?? null,
    external_id: userId,
    metadata: r.json.metadata,
  };

  return {
    ok: true,
    items: items.map((sub) => enrichSubscription(sub, customer, userId)),
    customer,
  };
}

/**
 * Find Polar customers by exact account email (recovery for missing external_id).
 * @param {string} token
 * @param {string} email
 */
async function listCustomersByEmail(token, email) {
  const base = getPolarApiBase();
  const normalized = String(email).trim();
  const candidates = Array.from(
    new Set([normalized, normalized.toLowerCase()].filter(Boolean))
  );

  /** @type {object[]} */
  const found = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const url = new URL(`${base}/customers/`);
    url.searchParams.set("email", candidate);
    url.searchParams.set("limit", "10");

    const orgId = getPolarOrganizationId();
    if (orgId) {
      url.searchParams.set("organization_id", orgId);
    }

    const r = await polarRequest(token, url.toString());
    if (!r.ok) return r;

    for (const item of Array.isArray(r.json.items) ? r.json.items : []) {
      const id = String(item.id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      found.push(item);
    }
  }

  return { ok: true, items: found };
}

/**
 * Attach our user id as Polar external_id when the customer has none.
 * Polar only allows setting this once.
 * @param {string} token
 * @param {object} customer
 * @param {string} userId
 */
async function backfillCustomerExternalId(token, customer, userId) {
  const customerId = customer?.id;
  if (!customerId || !userId) return;

  const existing = customer.external_id ?? customer.externalId ?? null;
  if (existing) return;

  const base = getPolarApiBase();
  const url = `${base}/customers/${encodeURIComponent(String(customerId))}`;
  const r = await polarRequest(token, url, {
    method: "PATCH",
    body: {
      external_id: String(userId),
      metadata: {
        ...(customer.metadata && typeof customer.metadata === "object"
          ? customer.metadata
          : {}),
        supabase_user_id: String(userId),
      },
    },
  });

  if (!r.ok) {
    // Non-fatal — subscription upsert can still proceed with explicitUserId.
    console.warn(
      "[polar] could not backfill customer.external_id:",
      r.error,
      customerId
    );
  }
}

/**
 * Recover subscriptions for customers who paid but never got external_id linked.
 * @param {string} token
 * @param {string} userId
 * @param {string} email
 */
async function findSubscriptionsByEmail(token, userId, email) {
  const customers = await listCustomersByEmail(token, email);
  if (!customers.ok) return customers;

  /** @type {object[]} */
  const all = [];
  /** @type {object | null} */
  let matchedCustomer = null;

  for (const customer of customers.items) {
    const customerEmail = String(customer.email ?? "")
      .trim()
      .toLowerCase();
    if (customerEmail !== String(email).trim().toLowerCase()) continue;

    matchedCustomer = customer;
    await backfillCustomerExternalId(token, customer, userId);

    const listed = await listSubscriptionsByCustomerId(token, customer.id);
    if (!listed.ok) return listed;

    for (const sub of listed.items) {
      all.push(enrichSubscription(sub, customer, userId));
    }
  }

  return { ok: true, items: all, customer: matchedCustomer };
}

/**
 * Pull the latest subscription(s) from Polar for this user and upsert into
 * freelancer_subscriptions. Use when webhooks are delayed or not configured.
 *
 * @param {string} userId
 * @param {{ email?: string | null }} [opts]
 * @returns {Promise<{ ok: boolean; synced?: boolean; error?: string }>}
 */
export async function reconcilePolarSubscriptionForUser(userId, opts = {}) {
  const token = getPolarAccessToken();
  if (!token || !userId) {
    return { ok: false, error: "missing_token_or_user" };
  }

  const email =
    typeof opts.email === "string" && opts.email.trim() ? opts.email.trim() : null;

  /** @type {object[]} */
  let items = [];

  const listed = await listSubscriptionsByExternalCustomerId(token, userId);
  if (!listed.ok) {
    return { ok: false, error: listed.error ?? "list_failed" };
  }
  items = listed.items;

  if (items.length === 0) {
    const state = await customerStateByExternalId(token, userId);
    if (!state.ok) {
      return { ok: false, error: state.error ?? "customer_state_failed" };
    }
    items = state.items;
  }

  // Existing paid customers often have no Polar external_id (email-matched
  // customer at checkout). Recover via account email.
  if (items.length === 0 && email) {
    const byEmail = await findSubscriptionsByEmail(token, userId, email);
    if (!byEmail.ok) {
      return { ok: false, error: byEmail.error ?? "email_lookup_failed" };
    }
    items = byEmail.items;
  }

  if (items.length === 0) {
    return { ok: true, synced: false };
  }

  const chosen = chooseSubscription(items);
  if (!chosen) {
    return { ok: true, synced: false };
  }

  const r = await upsertFreelancerSubscriptionFromPolar({
    subscription: chosen,
    explicitUserId: String(userId),
  });

  if (!r.ok) {
    return { ok: false, error: r.error ?? "upsert_failed" };
  }

  return { ok: true, synced: true };
}
