import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPolarAccessToken,
  getPolarApiBase,
  getPolarRequestHeaders,
} from "@/lib/billing/polar-env";
import { formatPolarApiError } from "@/lib/billing/format-polar-api-error";
import { isFoundingSubscriptionRow } from "@/lib/billing/founding-pricing";
import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";
import {
  seatsFromPolarSubscription,
  upsertFreelancerSubscriptionFromPolar,
} from "@/lib/billing/sync-subscription-from-polar";
import { EARLY_OFFER_PLANS, earlyOfferPrice } from "@/lib/billing/early-offer";

/**
 * Occupied seats = accepted workspace members. Owner is always at least 1.
 * @param {number} memberCount
 * @returns {number}
 */
export function desiredSeatsFromMemberCount(memberCount) {
  const n = Number(memberCount);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * List price per seat for a plan key ($9 Starter / $19 Growth).
 * @param {string | null | undefined} planKey
 * @returns {number}
 */
export function listPricePerSeat(planKey) {
  const key = String(planKey ?? "").toLowerCase();
  const plan = EARLY_OFFER_PLANS.find((p) => p.key === key);
  return plan?.listPriceMonthly ?? 9;
}

/**
 * @param {{ plan_key?: string | null; price_id?: string | null; polar_product_id?: string | null } | null | undefined} subscription
 * @returns {{ planKey: string; dollarsPerSeat: number; founding: boolean }}
 */
export function seatPriceForSubscription(subscription) {
  const planKey =
    String(subscription?.plan_key ?? "").toLowerCase() === "growth" ? "growth" : "starter";
  const founding = isFoundingSubscriptionRow(subscription);
  const list = listPricePerSeat(planKey);
  const dollarsPerSeat = founding ? earlyOfferPrice(list).discounted : list;
  return { planKey, dollarsPerSeat, founding };
}

/**
 * Resolve billing owner user id for a workspace (`workspaces.created_by`).
 * @param {string} workspaceId
 * @returns {Promise<{ ok: true; ownerUserId: string } | { ok: false; error: string; code?: string }>}
 */
export async function resolveWorkspaceBillingOwner(workspaceId) {
  const admin = createAdminClient();
  if (!admin) return { ok: false, code: "admin_unconfigured", error: "admin_client_unconfigured" };
  if (!workspaceId) return { ok: false, code: "missing_workspace", error: "missing_workspace" };

  const { data, error } = await admin
    .from("workspaces")
    .select("created_by")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) return { ok: false, code: "workspace_lookup_failed", error: error.message };
  if (!data?.created_by) return { ok: false, code: "workspace_not_found", error: "workspace_not_found" };
  return { ok: true, ownerUserId: String(data.created_by) };
}

/**
 * @param {string} ownerUserId
 * @returns {Promise<object | null>}
 */
async function loadOwnerSubscription(ownerUserId) {
  const admin = createAdminClient();
  if (!admin || !ownerUserId) return null;
  const { data } = await admin
    .from("freelancer_subscriptions")
    .select(
      "user_id, polar_subscription_id, polar_customer_id, status, plan_key, price_id, polar_product_id, seats, current_period_end, cancel_at_period_end"
    )
    .eq("user_id", ownerUserId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Whether a Polar subscription product/price is seat-based (quantity syncable).
 * Polar returns `seats: null` for fixed / non-seat products.
 * @param {object | null | undefined} polarSub
 * @returns {boolean}
 */
export function isPolarSubscriptionSeatBased(polarSub) {
  if (!polarSub || typeof polarSub !== "object") return false;
  if (polarSub.seats != null && Number.isFinite(Number(polarSub.seats))) return true;

  const price = polarSub.price && typeof polarSub.price === "object" ? polarSub.price : null;
  const amountType = String(price?.amount_type ?? price?.amountType ?? "").toLowerCase();
  if (amountType === "seat_based" || amountType === "seats") return true;

  const product = polarSub.product && typeof polarSub.product === "object" ? polarSub.product : null;
  const prices = Array.isArray(product?.prices) ? product.prices : [];
  return prices.some((p) => {
    const t = String(p?.amount_type ?? p?.amountType ?? "").toLowerCase();
    return t === "seat_based" || t === "seats";
  });
}

/**
 * @param {unknown} json
 * @returns {string}
 */
function polarErrorBlob(json) {
  if (!json || typeof json !== "object") return "";
  const j = /** @type {Record<string, unknown>} */ (json);
  const parts = [
    formatPolarApiError(j.detail),
    formatPolarApiError(j.message),
    formatPolarApiError(j.error),
    formatPolarApiError(j.error_description),
    typeof j.type === "string" ? j.type : null,
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

/**
 * Map Polar HTTP failures (and local preflight failures) to stable codes + user copy.
 * @param {{
 *   httpStatus?: number | null;
 *   json?: unknown;
 *   fallbackDetail?: string | null;
 *   preflightCode?: string | null;
 * }} args
 * @returns {{ code: string; error: string; polarDetail: string | null }}
 */
export function classifyPolarSeatSyncFailure(args) {
  const httpStatus = args.httpStatus ?? null;
  const json = args.json;
  const blob = polarErrorBlob(json);
  const detail =
    formatPolarApiError(
      json && typeof json === "object"
        ? /** @type {Record<string, unknown>} */ (json).detail
        : null
    ) ??
    formatPolarApiError(
      json && typeof json === "object"
        ? /** @type {Record<string, unknown>} */ (json).message
        : null
    ) ??
    formatPolarApiError(
      json && typeof json === "object"
        ? /** @type {Record<string, unknown>} */ (json).error_description
        : null
    ) ??
    formatPolarApiError(
      json && typeof json === "object"
        ? /** @type {Record<string, unknown>} */ (json).error
        : null
    ) ??
    (args.fallbackDetail ? String(args.fallbackDetail) : null);

  if (args.preflightCode === "not_seat_based") {
    return {
      code: "not_seat_based",
      error:
        "This workspace’s plan isn’t seat-based in Polar yet. The owner needs to switch to the seat-based Starter or Growth product, then try again.",
      polarDetail: detail,
    };
  }
  if (args.preflightCode === "subscription_inactive") {
    return {
      code: "subscription_inactive",
      error:
        "The workspace owner doesn’t have an active Polar subscription. Ask them to renew from Settings → Subscription, then try again.",
      polarDetail: detail,
    };
  }
  if (args.preflightCode === "missing_subscription") {
    return {
      code: "missing_subscription",
      error:
        "The workspace owner doesn’t have a billed subscription. Ask them to subscribe from Settings → Subscription, then try again.",
      polarDetail: detail,
    };
  }
  if (args.preflightCode === "missing_polar_id") {
    return {
      code: "missing_polar_id",
      error:
        "Subscription is missing a Polar id. Ask the owner to open Settings → Subscription and refresh billing.",
      polarDetail: detail,
    };
  }

  if (
    blob.includes("paymentfailed") ||
    blob.includes("payment_failed") ||
    blob.includes("payment method") ||
    blob.includes("requires_payment_method") ||
    blob.includes("card") ||
    httpStatus === 402
  ) {
    return {
      code: "payment_failed",
      error:
        "Couldn't charge for an extra seat — ask the owner to update their payment method in Settings → Subscription, then try accepting again.",
      polarDetail: detail,
    };
  }

  if (
    blob.includes("not seat") ||
    blob.includes("non-seat") ||
    blob.includes("non seat") ||
    blob.includes("seat-based") ||
    blob.includes("seat based") ||
    (blob.includes("seats") && (blob.includes("invalid") || blob.includes("not allowed") || blob.includes("unsupported")))
  ) {
    return {
      code: "not_seat_based",
      error:
        "This workspace’s plan isn’t seat-based in Polar yet. The owner needs to switch to the seat-based Starter or Growth product, then try again.",
      polarDetail: detail,
    };
  }

  if (
    blob.includes("insufficient_scope") ||
    blob.includes("insufficient scope") ||
    (httpStatus === 403 && blob.includes("scope"))
  ) {
    return {
      code: "insufficient_scope",
      error:
        "Billing couldn’t update seats (Polar token missing write access). Ask the site admin to grant subscriptions:write on the Polar access token.",
      polarDetail: detail,
    };
  }

  if (httpStatus === 401 || blob.includes("invalid_token") || blob.includes("invalid token")) {
    return {
      code: "auth_failed",
      error:
        "Billing couldn’t reach Polar (auth failed). Ask the site admin to check POLAR_ACCESS_TOKEN / POLAR_SERVER.",
      polarDetail: detail,
    };
  }

  if (
    blob.includes("canceled") ||
    blob.includes("cancelled") ||
    blob.includes("inactive") ||
    blob.includes("ended")
  ) {
    return {
      code: "subscription_inactive",
      error:
        "The workspace owner’s subscription isn’t active in Polar. Ask them to renew from Settings → Subscription, then try again.",
      polarDetail: detail,
    };
  }

  return {
    code: "polar_error",
    error:
      detail ||
      (httpStatus ? `Polar returned ${httpStatus} while updating seats` : "Could not update billed seats"),
    polarDetail: detail,
  };
}

/**
 * User-facing copy for invite accept / seat sync failures.
 * @param {{ code?: string; error?: string } | null | undefined} seatSync
 * @returns {string}
 */
export function userFacingSeatSyncError(seatSync) {
  if (!seatSync) {
    return "Couldn't add a billing seat. Ask the owner to check Settings → Subscription, then try again.";
  }
  if (seatSync.error && String(seatSync.error).trim()) return String(seatSync.error).trim();
  return "Couldn't add a billing seat. Ask the owner to check Settings → Subscription, then try again.";
}

/**
 * GET a Polar subscription by id (includes product/price for seat-based detection).
 * @param {string} polarSubId
 * @param {string} token
 * @returns {Promise<{ ok: true; json: object } | { ok: false; httpStatus: number; json: unknown; error: string }>}
 */
async function fetchPolarSubscription(polarSubId, token) {
  const url = `${getPolarApiBase()}/subscriptions/${encodeURIComponent(String(polarSubId))}`;
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: getPolarRequestHeaders(token),
      cache: "no-store",
    });
  } catch (e) {
    console.error("[workspace-seats] Polar GET subscription failed:", e);
    return {
      ok: false,
      httpStatus: 0,
      json: null,
      error: "Could not reach Polar to read subscription",
    };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[workspace-seats] Polar GET subscription:", res.status, JSON.stringify(json));
    return {
      ok: false,
      httpStatus: res.status,
      json,
      error: formatPolarApiError(json?.detail) ?? formatPolarApiError(json?.error) ?? `Polar returned ${res.status}`,
    };
  }
  return { ok: true, json };
}

/**
 * Whether the workspace owner can invite teammates (paid-like Polar subscription).
 * Prefers live Polar status when reachable so canceled/stale local rows don’t pass.
 * @param {string} workspaceId
 * @returns {Promise<{ ok: true; subscription: object } | { ok: false; error: string; code?: string }>}
 */
export async function requirePaidOwnerSubscriptionForWorkspace(workspaceId) {
  const owner = await resolveWorkspaceBillingOwner(workspaceId);
  if (!owner.ok) return owner;

  const subscription = await loadOwnerSubscription(owner.ownerUserId);
  if (!hasPaidFreelancerSubscription(subscription)) {
    return {
      ok: false,
      code: "missing_subscription",
      error:
        "A paid Starter or Growth plan is required to invite teammates. Subscribe from Settings → Subscription.",
    };
  }
  if (!subscription.polar_subscription_id) {
    return {
      ok: false,
      code: "missing_polar_id",
      error: "Subscription is missing a Polar id. Open Settings → Subscription and refresh billing.",
    };
  }

  const token = getPolarAccessToken();
  if (token) {
    const live = await fetchPolarSubscription(String(subscription.polar_subscription_id), token);
    if (live.ok) {
      await upsertFreelancerSubscriptionFromPolar({
        subscription: live.json,
        explicitUserId: owner.ownerUserId,
      });
      if (!hasPaidFreelancerSubscription(live.json)) {
        return {
          ok: false,
          code: "subscription_inactive",
          error:
            "Your Polar subscription isn’t active. Renew from Settings → Subscription before inviting teammates.",
        };
      }
      if (!isPolarSubscriptionSeatBased(live.json)) {
        return {
          ok: false,
          code: "not_seat_based",
          error:
            "Your current Polar product isn’t seat-based. Switch to the seat-based Starter or Growth plan in Polar (or resubscribe from Settings), then invite teammates.",
        };
      }
      return { ok: true, subscription: { ...subscription, ...live.json } };
    }
    // Live Polar unreachable: fall through to local paid check (invite still possible).
    console.warn("[workspace-seats] invite gate Polar GET failed:", live.httpStatus, live.error);
  }

  return { ok: true, subscription };
}

/**
 * Count accepted workspace members.
 * @param {string} workspaceId
 * @returns {Promise<number>}
 */
export async function countWorkspaceMembers(workspaceId) {
  const admin = createAdminClient();
  if (!admin || !workspaceId) return 0;
  const { count, error } = await admin
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) {
    console.error("[workspace-seats] count members:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Sync Polar seat quantity to accepted member count for a workspace.
 * Uses `proration_behavior: "invoice"` so adds charge immediately.
 *
 * @param {string} workspaceId
 * @returns {Promise<{ ok: true; seats: number; skipped?: boolean } | { ok: false; error: string; code?: string; polarDetail?: string | null }>}
 */
export async function syncWorkspaceSeatsToPolar(workspaceId) {
  const token = getPolarAccessToken();
  if (!token) {
    return {
      ok: false,
      code: "missing_token",
      error: "POLAR_ACCESS_TOKEN is not set",
    };
  }

  const owner = await resolveWorkspaceBillingOwner(workspaceId);
  if (!owner.ok) return owner;

  const subscription = await loadOwnerSubscription(owner.ownerUserId);
  if (!subscription) {
    return { ok: false, ...classifyPolarSeatSyncFailure({ preflightCode: "missing_subscription" }) };
  }
  if (!subscription.polar_subscription_id) {
    return { ok: false, ...classifyPolarSeatSyncFailure({ preflightCode: "missing_polar_id" }) };
  }

  const polarSubId = String(subscription.polar_subscription_id);
  const live = await fetchPolarSubscription(polarSubId, token);
  if (!live.ok) {
    const classified = classifyPolarSeatSyncFailure({
      httpStatus: live.httpStatus,
      json: live.json,
      fallbackDetail: live.error,
    });
    return { ok: false, ...classified };
  }

  // Keep local mirror honest (fixes stale "active" while Polar is canceled).
  await upsertFreelancerSubscriptionFromPolar({
    subscription: live.json,
    explicitUserId: owner.ownerUserId,
  });

  if (!hasPaidFreelancerSubscription(live.json)) {
    return {
      ok: false,
      ...classifyPolarSeatSyncFailure({
        preflightCode: "subscription_inactive",
        fallbackDetail: `Polar status=${live.json?.status ?? "unknown"}`,
      }),
    };
  }

  if (!isPolarSubscriptionSeatBased(live.json)) {
    console.error(
      "[workspace-seats] subscription is not seat-based:",
      polarSubId,
      "status=",
      live.json?.status,
      "seats=",
      live.json?.seats,
      "price.amount_type=",
      live.json?.price?.amount_type ?? live.json?.price?.amountType ?? null,
      "product=",
      live.json?.product?.name ?? live.json?.product_id
    );
    return {
      ok: false,
      ...classifyPolarSeatSyncFailure({
        preflightCode: "not_seat_based",
        fallbackDetail: "Polar seats is null / fixed price product",
      }),
    };
  }

  const memberCount = await countWorkspaceMembers(workspaceId);
  const desiredSeats = desiredSeatsFromMemberCount(memberCount);
  const currentSeats = seatsFromPolarSubscription(live.json);

  if (desiredSeats === currentSeats) {
    return { ok: true, seats: desiredSeats, skipped: true };
  }

  const url = `${getPolarApiBase()}/subscriptions/${encodeURIComponent(polarSubId)}`;
  let res;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: getPolarRequestHeaders(token, { json: true }),
      body: JSON.stringify({
        seats: desiredSeats,
        proration_behavior: "invoice",
      }),
      cache: "no-store",
    });
  } catch (e) {
    console.error("[workspace-seats] Polar PATCH failed:", e);
    return {
      ok: false,
      code: "network_error",
      error: "Could not reach Polar to update seats",
    };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(
      "[workspace-seats] Polar seats update failed:",
      res.status,
      "body=",
      JSON.stringify(json)
    );
    const classified = classifyPolarSeatSyncFailure({
      httpStatus: res.status,
      json,
      fallbackDetail: `Polar returned ${res.status}`,
    });
    return { ok: false, ...classified };
  }

  const upsert = await upsertFreelancerSubscriptionFromPolar({
    subscription: { ...json, seats: json.seats ?? desiredSeats },
    explicitUserId: owner.ownerUserId,
  });
  if (!upsert.ok) {
    // Polar succeeded; local mirror lag is recoverable via webhook/reconcile.
    console.warn("[workspace-seats] local upsert after seat PATCH:", upsert.error);
  }

  return { ok: true, seats: desiredSeats };
}

/**
 * Undo accept_workspace_invite when Polar seat billing fails.
 * @param {{
 *   workspaceId: string;
 *   userId: string;
 *   inviteId: string;
 * }} args
 */
export async function rollbackAcceptedWorkspaceInvite(args) {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "admin_client_unconfigured" };

  const { workspaceId, userId, inviteId } = args;
  if (!workspaceId || !userId || !inviteId) {
    return { ok: false, error: "missing_rollback_args" };
  }

  const { data: projects } = await admin
    .from("projects")
    .select("id")
    .eq("workspace_id", workspaceId);
  const projectIds = (projects ?? []).map((p) => p.id).filter(Boolean);
  if (projectIds.length > 0) {
    await admin
      .from("project_staff_access")
      .delete()
      .eq("user_id", userId)
      .in("project_id", projectIds);
  }

  const { error: delMem } = await admin
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .neq("role", "owner");

  if (delMem) {
    console.error("[workspace-seats] rollback delete member:", delMem.message);
    return { ok: false, error: delMem.message };
  }

  const { error: invErr } = await admin
    .from("workspace_invites")
    .update({
      status: "pending",
      accepted_at: null,
      accepted_user_id: null,
    })
    .eq("id", inviteId)
    .eq("workspace_id", workspaceId);

  if (invErr) {
    console.error("[workspace-seats] rollback invite:", invErr.message);
    return { ok: false, error: invErr.message };
  }

  return { ok: true };
}
