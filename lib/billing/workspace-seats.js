import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPolarAccessToken,
  getPolarApiBase,
  getPolarProductGrowthFounding,
  getPolarProductStarterFounding,
  getPolarRequestHeaders,
} from "@/lib/billing/polar-env";
import { formatPolarApiError } from "@/lib/billing/format-polar-api-error";
import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";
import { upsertFreelancerSubscriptionFromPolar } from "@/lib/billing/sync-subscription-from-polar";
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
 * @param {{ plan_key?: string | null; price_id?: string | null } | null | undefined} subscription
 * @returns {{ planKey: string; dollarsPerSeat: number; founding: boolean }}
 */
export function seatPriceForSubscription(subscription) {
  const planKey =
    String(subscription?.plan_key ?? "").toLowerCase() === "growth" ? "growth" : "starter";
  const priceId = String(subscription?.price_id ?? "");
  const foundingIds = new Set(
    [getPolarProductStarterFounding(), getPolarProductGrowthFounding()].filter(Boolean)
  );
  const founding = Boolean(priceId && foundingIds.has(priceId));
  const list = listPricePerSeat(planKey);
  const dollarsPerSeat = founding ? earlyOfferPrice(list).discounted : list;
  return { planKey, dollarsPerSeat, founding };
}

/**
 * Resolve billing owner user id for a workspace (`workspaces.created_by`).
 * @param {string} workspaceId
 * @returns {Promise<{ ok: true; ownerUserId: string } | { ok: false; error: string }>}
 */
export async function resolveWorkspaceBillingOwner(workspaceId) {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "admin_client_unconfigured" };
  if (!workspaceId) return { ok: false, error: "missing_workspace" };

  const { data, error } = await admin
    .from("workspaces")
    .select("created_by")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data?.created_by) return { ok: false, error: "workspace_not_found" };
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
      "user_id, polar_subscription_id, polar_customer_id, status, plan_key, price_id, seats, current_period_end, cancel_at_period_end"
    )
    .eq("user_id", ownerUserId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Whether the workspace owner can invite teammates (paid-like Polar subscription).
 * @param {string} workspaceId
 * @returns {Promise<{ ok: true; subscription: object } | { ok: false; error: string }>}
 */
export async function requirePaidOwnerSubscriptionForWorkspace(workspaceId) {
  const owner = await resolveWorkspaceBillingOwner(workspaceId);
  if (!owner.ok) return owner;

  const subscription = await loadOwnerSubscription(owner.ownerUserId);
  if (!hasPaidFreelancerSubscription(subscription)) {
    return {
      ok: false,
      error:
        "A paid Starter or Growth plan is required to invite teammates. Subscribe from Settings → Subscription.",
    };
  }
  if (!subscription.polar_subscription_id) {
    return {
      ok: false,
      error: "Subscription is missing a Polar id. Open Settings → Subscription and refresh billing.",
    };
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
 * @returns {Promise<{ ok: true; seats: number; skipped?: boolean } | { ok: false; error: string }>}
 */
export async function syncWorkspaceSeatsToPolar(workspaceId) {
  const token = getPolarAccessToken();
  if (!token) return { ok: false, error: "POLAR_ACCESS_TOKEN is not set" };

  const owner = await resolveWorkspaceBillingOwner(workspaceId);
  if (!owner.ok) return owner;

  const subscription = await loadOwnerSubscription(owner.ownerUserId);
  if (!hasPaidFreelancerSubscription(subscription)) {
    return { ok: false, error: "Workspace owner does not have an active subscription" };
  }

  const polarSubId = subscription.polar_subscription_id;
  if (!polarSubId) {
    return { ok: false, error: "Missing Polar subscription id" };
  }

  const memberCount = await countWorkspaceMembers(workspaceId);
  const desiredSeats = desiredSeatsFromMemberCount(memberCount);
  const currentSeats = desiredSeatsFromMemberCount(subscription.seats ?? 1);

  if (desiredSeats === currentSeats) {
    return { ok: true, seats: desiredSeats, skipped: true };
  }

  const url = `${getPolarApiBase()}/subscriptions/${encodeURIComponent(String(polarSubId))}`;
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
    return { ok: false, error: "Could not reach Polar to update seats" };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[workspace-seats] Polar seats update:", res.status, json);
    const detail =
      formatPolarApiError(json?.detail) ??
      formatPolarApiError(json?.message) ??
      formatPolarApiError(json?.error) ??
      `Polar returned ${res.status}`;
    return { ok: false, error: detail };
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
