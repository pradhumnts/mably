import { createAdminClient } from "@/lib/supabase/admin";

/** Heartbeat runs every 60s while a tab is visible; allow one missed beat. */
export const ONLINE_WINDOW_MS = 2.5 * 60 * 1000;

/**
 * User ids with Mably open in a visible tab within `ONLINE_WINDOW_MS`.
 * Returns an empty set on any failure so callers fall back to emailing.
 *
 * @param {string[]} userIds
 * @returns {Promise<Set<string>>}
 */
export async function fetchOnlineUserIds(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Set();

  const admin = createAdminClient();
  if (!admin) return new Set();

  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from("user_presence")
    .select("user_id")
    .in("user_id", ids)
    .gte("last_seen_at", since);

  if (error) {
    console.warn("[presence] lookup failed — emailing everyone:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => String(r.user_id)));
}
