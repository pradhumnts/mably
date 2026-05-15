import { getAuthProviderAvatarUrl } from "@/lib/auth/user-avatar-url";

/**
 * Copy OAuth/provider avatar into profiles.avatar_url when the profile has none.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @returns {Promise<string | null>} URL written or already stored
 */
export async function syncProfileAvatarFromAuth(supabase, user) {
  if (!user?.id) return null;

  const fromAuth = getAuthProviderAvatarUrl(user);
  if (!fromAuth) return null;

  const { data: row, error: readErr } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    console.warn("syncProfileAvatarFromAuth read:", readErr.message);
    return fromAuth;
  }

  const existing = typeof row?.avatar_url === "string" ? row.avatar_url.trim() : "";
  if (existing) return existing;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: fromAuth })
    .eq("id", user.id);

  if (updateErr) {
    console.warn("syncProfileAvatarFromAuth update:", updateErr.message);
  }

  return fromAuth;
}
