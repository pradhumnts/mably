import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";

/**
 * @typedef {{
 *   userId: string | null;
 *   email: string;
 *   fullName: string;
 *   avatarUrl: string | null;
 *   roleLine: string;
 *   prefs: ReturnType<typeof mergeAllNotificationPreferences>;
 * }} ProjectNotificationTarget
 */

/**
 * @param {unknown[]} rows
 * @returns {ProjectNotificationTarget[]}
 */
function mapAndDedupeRpcRows(rows) {
  /** @type {Map<string, ProjectNotificationTarget>} */
  const byEmail = new Map();

  for (const raw of rows) {
    const row = /** @type {Record<string, unknown>} */ (raw);
    const userId = row.user_id != null ? String(row.user_id) : null;
    const rawEmail = typeof row.email === "string" ? row.email.trim() : "";
    const key = rawEmail.toLowerCase();
    if (!key) continue;

    const next = {
      userId,
      email: rawEmail || key,
      fullName: typeof row.full_name === "string" ? row.full_name.trim() : "",
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      roleLine: typeof row.role_line === "string" ? row.role_line : "Member",
      prefs: mergeAllNotificationPreferences(row.notification_preferences),
    };

    const prev = byEmail.get(key);
    if (!prev) {
      byEmail.set(key, next);
      continue;
    }
    if (!prev.userId && next.userId) {
      byEmail.set(key, next);
    }
  }

  return Array.from(byEmail.values());
}

/**
 * Legacy path when `SUPABASE_SERVICE_ROLE_KEY` is set (e.g. before RPC migration is applied).
 * @param {string} pid
 * @returns {Promise<ProjectNotificationTarget[]>}
 */
async function fetchTargetsViaAdmin(pid) {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data: project, error: pErr } = await admin
    .from("projects")
    .select("id, name, freelancer_id, invite_email, client_name_snapshot")
    .eq("id", pid)
    .maybeSingle();

  if (pErr || !project) return [];

  /** @type {Map<string, ProjectNotificationTarget>} */
  const byEmail = new Map();

  async function addProfileTarget(userId, roleLine) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, full_name, avatar_url, notification_preferences")
      .eq("id", userId)
      .maybeSingle();

    const raw = (profile?.email ?? "").trim();
    const key = raw.toLowerCase();
    if (!key) return;

    byEmail.set(key, {
      userId: profile?.id ?? userId,
      email: raw || key,
      fullName: (profile?.full_name ?? "").trim() || key.split("@")[0] || "Member",
      avatarUrl: profile?.avatar_url ?? null,
      roleLine,
      prefs: mergeAllNotificationPreferences(profile?.notification_preferences),
    });
  }

  await addProfileTarget(project.freelancer_id, "Freelancer");

  const { data: members } = await admin
    .from("project_members")
    .select("user_id, role")
    .eq("project_id", pid);

  for (const m of members ?? []) {
    if (m.role === "client" && m.user_id) {
      await addProfileTarget(m.user_id, "Client");
    }
  }

  const invite = typeof project.invite_email === "string" ? project.invite_email.trim() : "";
  if (invite) {
    const key = invite.toLowerCase();
    if (key && !byEmail.has(key)) {
      byEmail.set(key, {
        userId: null,
        email: invite,
        fullName: (project.client_name_snapshot ?? "").trim() || invite.split("@")[0] || "Client",
        avatarUrl: null,
        roleLine: "Client",
        prefs: mergeAllNotificationPreferences({}),
      });
    }
  }

  return Array.from(byEmail.values());
}

/**
 * Freelancer + portal clients (+ invite email) with notification prefs.
 * Uses RPC `get_portal_notification_recipients` so the normal session JWT is enough.
 * Falls back to the service-role client only if the RPC is missing or returns nothing.
 *
 * @param {string} projectId
 * @returns {Promise<ProjectNotificationTarget[]>}
 */
export async function fetchProjectNotificationTargets(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_portal_notification_recipients", {
    p_project_id: pid,
  });

  if (!error && Array.isArray(data) && data.length > 0) {
    return mapAndDedupeRpcRows(data);
  }

  if (error && process.env.NODE_ENV === "development") {
    console.warn(
      "[notifications] get_portal_notification_recipients RPC failed — apply latest migrations or set SUPABASE_SERVICE_ROLE_KEY. Error:",
      error.message
    );
  }

  const fallback = await fetchTargetsViaAdmin(pid);
  if (
    fallback.length === 0 &&
    !createAdminClient() &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      "[notifications] No recipients: run `supabase db push` for migration 20260425200000_get_portal_notification_recipients.sql, or set SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return fallback;
}
