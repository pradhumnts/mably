import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resolve the signed-in user's display name + avatar for activity / library stamps.
 * Always prefer the auth user + their own profile — never project client snapshots
 * (those are primary-client denormalizations and break multi-stakeholder attribution).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @returns {Promise<{ displayName: string; avatarUrl: string | null }>}
 */
export async function resolveAuthenticatedActorIdentity(supabase, user) {
  if (!user?.id) {
    return { displayName: "Member", avatarUrl: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const meta =
    user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
  const metaName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";

  const email =
    (typeof profile?.email === "string" && profile.email.trim()) ||
    (typeof user.email === "string" && user.email.trim()) ||
    "";

  const displayName =
    (typeof profile?.full_name === "string" && profile.full_name.trim()) ||
    metaName ||
    (email ? email.split("@")[0] : "") ||
    "Member";

  const avatarUrl =
    (typeof profile?.avatar_url === "string" && profile.avatar_url.trim()) || null;

  return { displayName, avatarUrl };
}

/**
 * Overlay live profile names onto library rows by `created_by`.
 * Uploader stamps can go stale / wrong when portal snapshots confuse identities;
 * `created_by` (auth uid at insert) is the source of truth.
 *
 * @param {Array<Record<string, any>>} rows
 * @param {import("@supabase/supabase-js").SupabaseClient | null} [fallbackClient]
 */
export async function overlayLiveUploaderIdentities(rows, fallbackClient = null) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = [...new Set(list.map((r) => r?.created_by).filter(Boolean).map(String))];
  if (ids.length === 0) return list;

  const reader = createAdminClient() || fallbackClient;
  if (!reader) return list;

  const { data: profiles, error } = await reader
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", ids);

  if (error) {
    console.error("[library] overlay uploader identities:", error.message);
    return list;
  }

  /** @type {Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>} */
  const byId = {};
  for (const p of profiles ?? []) {
    byId[String(p.id)] = p;
  }

  return list.map((row) => {
    const uid = row?.created_by != null ? String(row.created_by) : "";
    const prof = uid ? byId[uid] : null;
    if (!prof) return row;
    const liveName =
      (typeof prof.full_name === "string" && prof.full_name.trim()) ||
      (typeof prof.email === "string" && prof.email.trim()
        ? prof.email.trim().split("@")[0]
        : "") ||
      "";
    if (!liveName) return row;
    return {
      ...row,
      created_by_display_name: liveName,
      created_by_avatar_url:
        (typeof prof.avatar_url === "string" && prof.avatar_url.trim()) ||
        row.created_by_avatar_url ||
        null,
    };
  });
}
