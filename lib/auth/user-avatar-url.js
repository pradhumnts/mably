/**
 * Resolve a profile image URL from Supabase Auth user metadata / identities.
 * Google OAuth stores `picture`; some providers use `avatar_url` or `avatar`.
 *
 * @param {import("@supabase/supabase-js").User | { user_metadata?: Record<string, unknown>; identities?: Array<{ identity_data?: Record<string, unknown> }> } | null | undefined} user
 * @returns {string | null}
 */
export function getAuthProviderAvatarUrl(user) {
  if (!user) return null;

  const meta =
    user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};

  for (const key of ["avatar_url", "picture", "avatar"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const identities = user.identities;
  if (!Array.isArray(identities)) return null;

  for (const identity of identities) {
    const data = identity?.identity_data;
    if (!data || typeof data !== "object") continue;
    for (const key of ["avatar_url", "picture", "avatar"]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}
