import { resolveClientLandingPath } from "@/lib/auth/resolve-client-landing";

/**
 * Load profile fields needed for post-login / middleware onboarding checks.
 * If `onboarding_completed_at` (or related columns) are missing from the DB schema,
 * falls back to `role` only and treats onboarding as incomplete.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ role: string; onboarding_completed_at: string | null } | null>}
 */
export async function fetchProfileOnboardingRow(supabase, userId) {
  const r1 = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (!r1.error) {
    return r1.data;
  }

  const msg = (r1.error?.message ?? "").toLowerCase();
  const missingOnboardingColumns =
    msg.includes("onboarding_completed_at") || msg.includes("freelancer_survey_category");

  if (!missingOnboardingColumns) {
    return null;
  }

  const r2 = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (r2.error || !r2.data) {
    return null;
  }

  return {
    role: r2.data.role,
    onboarding_completed_at: null,
  };
}

/**
 * Default post-login path for authenticated users (OTP / OAuth).
 * Honors `next` when set; otherwise sends new freelancers through onboarding once,
 * and routes clients to their portal (or chooser when they have multiple).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @param {string | null} safeNext — sanitized path from {@link sanitizeNextPath}
 * @returns {Promise<string>}
 */
export async function resolveAfterAuthRedirect(supabase, user, safeNext) {
  if (safeNext) return safeNext;

  const prof = await fetchProfileOnboardingRow(supabase, user.id);

  if (!prof) {
    return "/onboarding";
  }

  if (prof.role === "client") {
    return resolveClientLandingPath(supabase);
  }

  if (!prof.onboarding_completed_at) {
    return "/onboarding";
  }

  return "/projects";
}
