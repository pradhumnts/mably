import { createClient } from "@/lib/supabase/server";

const MAX_NOTIFICATION_ID_LENGTH = 256;

/**
 * @param {string} id
 */
function normalizeNotificationId(id) {
  const trimmed = String(id || "").trim();
  if (!trimmed || trimmed.length > MAX_NOTIFICATION_ID_LENGTH) return null;
  return trimmed;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<string[] | null>}
 */
export async function getFreelancerNotificationReadIds(supabase, userId) {
  const { data, error } = await supabase
    .from("freelancer_notification_reads")
    .select("notification_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[notification-reads] fetch:", error);
    return null;
  }

  return (data ?? [])
    .map((row) => normalizeNotificationId(row.notification_id))
    .filter(Boolean);
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {string[]} notificationIds
 */
export async function markFreelancerNotificationsRead(supabase, userId, notificationIds) {
  const ids = [...new Set(notificationIds.map(normalizeNotificationId).filter(Boolean))];
  if (ids.length === 0) return { ok: true };

  const now = new Date().toISOString();
  const rows = ids.map((notification_id) => ({
    user_id: userId,
    notification_id,
    read_at: now,
  }));

  const { error } = await supabase.from("freelancer_notification_reads").upsert(rows, {
    onConflict: "user_id,notification_id",
  });

  if (error) {
    console.error("[notification-reads] upsert:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * @returns {Promise<string[] | null>}
 */
export async function getFreelancerNotificationReadIdsForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;
  return getFreelancerNotificationReadIds(supabase, user.id);
}

/**
 * @param {string[]} notificationIds
 */
export async function markFreelancerNotificationsReadForCurrentUser(notificationIds) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Not signed in" };
  return markFreelancerNotificationsRead(supabase, user.id, notificationIds);
}
