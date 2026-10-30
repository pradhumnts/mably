import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * @typedef {{
 *   id: string;
 *   email: string | undefined;
 *   phone: string | undefined;
 *   role: string | undefined;
 *   is_anonymous: boolean;
 *   user_metadata: Record<string, any>;
 *   app_metadata: Record<string, any>;
 * }} ClaimsUser
 */

/**
 * Signed-in user from the verified access token (`getClaims()`): verified locally against the
 * project's JWKS (asymmetric signing keys), falling back to an Auth round trip for legacy
 * HS256 tokens. Same guarantee Postgres/RLS relies on (signature + expiry).
 *
 * The token carries `id`, `email`, `user_metadata` and `app_metadata` only — no `identities`,
 * `created_at` or other User fields. Call `supabase.auth.getUser()` directly when those are needed.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<ClaimsUser | null>}
 */
export async function getUserFromClaims(supabase) {
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) return null;
    const claims = data?.claims;
    if (!claims || typeof claims.sub !== "string" || !claims.sub) return null;
    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      phone: typeof claims.phone === "string" && claims.phone ? claims.phone : undefined,
      role: typeof claims.role === "string" ? claims.role : undefined,
      is_anonymous: Boolean(claims.is_anonymous),
      user_metadata:
        claims.user_metadata && typeof claims.user_metadata === "object"
          ? claims.user_metadata
          : {},
      app_metadata:
        claims.app_metadata && typeof claims.app_metadata === "object"
          ? claims.app_metadata
          : {},
    };
  } catch {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  }
}

/**
 * {@link getUserFromClaims} deduped per server render (React `cache`). Outside a render
 * (Server Actions, Route Handlers) React `cache` does not memoize.
 *
 * @returns {Promise<ClaimsUser | null>}
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  return getUserFromClaims(supabase);
});
