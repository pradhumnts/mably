import { createAdminClient } from "@/lib/supabase/admin";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";
import { isNotificationAllowedByPreferences } from "@/lib/notifications/freelancer-notification-meta";
import { stableNotificationDedupeKey } from "@/lib/notifications/stable-notification-id";

/**
 * @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient
 */

/**
 * @param {{
 *   userId: string;
 *   type: string;
 *   projectId: string;
 *   sourceId?: string;
 *   title: string;
 *   body?: string;
 *   href: string;
 *   createdAt?: string;
 *   priority?: number;
 *   actorName?: string | null;
 *   actorAvatar?: string | null;
 *   projectName?: string;
 *   projectLogo?: string;
 *   metadata?: Record<string, unknown>;
 *   notificationPreferences?: unknown;
 * }} input
 */
export async function materializeFreelancerInboxNotification(input) {
  const admin = createAdminClient();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      console.info("[inbox] Skipping materialize — no service role.");
    }
    return { ok: false, error: "No admin client" };
  }

  const userId = String(input.userId || "").trim();
  const projectId = String(input.projectId || "").trim();
  const type = String(input.type || "").trim();
  if (!userId || !projectId || !type) {
    return { ok: false, error: "Missing fields" };
  }

  let prefs = input.notificationPreferences;
  if (prefs === undefined) {
    const { data: profile } = await admin
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();
    prefs = profile?.notification_preferences;
  }

  const mergedPrefs = mergeAllNotificationPreferences(prefs);
  if (!isNotificationAllowedByPreferences(type, mergedPrefs)) {
    return { ok: true, skipped: true };
  }

  const dedupeKey = stableNotificationDedupeKey({
    type,
    projectId,
    sourceId: input.sourceId,
  });

  const row = {
    user_id: userId,
    dedupe_key: dedupeKey,
    type,
    project_id: projectId,
    title: String(input.title || "Update").slice(0, 500),
    body: input.body ? String(input.body).slice(0, 2000) : null,
    href: String(input.href || `/project/${projectId}/dashboard`).slice(0, 2000),
    priority: Number.isFinite(input.priority) ? Number(input.priority) : 99,
    actor_name: input.actorName ? String(input.actorName).slice(0, 200) : null,
    actor_avatar_url: input.actorAvatar ? String(input.actorAvatar).slice(0, 2000) : null,
    project_name: input.projectName ? String(input.projectName).slice(0, 200) : null,
    project_logo_url: input.projectLogo ? String(input.projectLogo).slice(0, 2000) : null,
    metadata:
      input.metadata && typeof input.metadata === "object" ? input.metadata : {},
    created_at: input.createdAt || new Date().toISOString(),
  };

  const { error } = await admin.from("freelancer_notifications").upsert(row, {
    onConflict: "user_id,dedupe_key",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error("[inbox] materialize:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, dedupeKey };
}

/**
 * Backfill derived items into inbox (does not reset read_at on existing rows).
 * @param {string} userId
 * @param {Array<Record<string, unknown>>} derivedItems
 */
export async function syncDerivedItemsToFreelancerInbox(userId, derivedItems) {
  const admin = createAdminClient();
  if (!admin || !derivedItems.length) return;

  for (const item of derivedItems) {
    await materializeFreelancerInboxNotification({
      userId,
      type: String(item.type),
      projectId: String(item.projectId),
      sourceId: item.sourceId ? String(item.sourceId) : undefined,
      title: String(item.title || "Update"),
      body: item.body ? String(item.body) : undefined,
      href: String(item.href || "#"),
      createdAt: item.createdAt ? String(item.createdAt) : undefined,
      priority: typeof item.priority === "number" ? item.priority : undefined,
      actorName: item.actorName ? String(item.actorName) : null,
      actorAvatar: item.actorAvatar ? String(item.actorAvatar) : null,
      projectName: item.projectName ? String(item.projectName) : undefined,
      projectLogo: item.projectLogo ? String(item.projectLogo) : undefined,
    });
  }
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} userId
 * @param {string} dedupeKey
 */
export async function markFreelancerInboxRead(supabase, userId, dedupeKey) {
  const key = String(dedupeKey || "").trim();
  if (!key) return { ok: false, error: "Missing id" };

  const { error } = await supabase
    .from("freelancer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("dedupe_key", key)
    .is("read_at", null);

  if (error) {
    console.error("[inbox] mark read:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} userId
 * @param {string[]} dedupeKeys
 */
export async function markFreelancerInboxReadMany(supabase, userId, dedupeKeys) {
  const keys = [...new Set(dedupeKeys.map((k) => String(k).trim()).filter(Boolean))];
  if (!keys.length) return { ok: true };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("freelancer_notifications")
    .update({ read_at: now })
    .eq("user_id", userId)
    .in("dedupe_key", keys)
    .is("read_at", null);

  if (error) {
    console.error("[inbox] mark read many:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} userId
 * @param {{ includeRead?: boolean; limit?: number }} [options]
 */
export async function listFreelancerInboxNotifications(supabase, userId, options = {}) {
  const limit = options.limit ?? 50;
  let query = supabase
    .from("freelancer_notifications")
    .select(
      "dedupe_key, type, project_id, title, body, href, priority, actor_name, actor_avatar_url, project_name, project_logo_url, created_at, read_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!options.includeRead) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[inbox] list:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.dedupe_key,
    type: row.type,
    projectId: row.project_id,
    projectName: row.project_name,
    title: row.title,
    body: row.body,
    href: row.href,
    priority: row.priority,
    createdAt: row.created_at,
    readAt: row.read_at,
    actorName: row.actor_name,
    actorAvatar: row.actor_avatar_url,
    projectLogo: row.project_logo_url,
    clientName: row.actor_name,
    clientAvatar: row.actor_avatar_url,
  }));
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} userId
 */
export async function countFreelancerInboxUnread(supabase, userId) {
  const { count, error } = await supabase
    .from("freelancer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}
