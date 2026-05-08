/**
 * Where a `client`-role user should land after auth (no explicit `next`),
 * or when they hit a freelancer-only surface and need to be bounced.
 *
 *  - 1 accessible portal → /project/{id}/dashboard
 *  - 0 or 2+ portals     → /portal (chooser; renders an empty state when 0)
 *
 * Goes straight to /dashboard so returning clients don't replay the welcome
 * tour — the welcome flow stays reachable through the original invite link.
 *
 * RLS already scopes the `projects` select to portals this user can actually
 * read (owner / member / invited by email), so a vanilla select is enough.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<string>}
 */
export async function resolveClientLandingPath(supabase) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(2);
    if (error) return "/portal";
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 1) return `/project/${rows[0].id}/dashboard`;
    return "/portal";
  } catch {
    return "/portal";
  }
}
