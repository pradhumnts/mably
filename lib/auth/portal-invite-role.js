import {
  normalizeEmail,
  parseProjectIdFromNextPath,
} from "@/lib/auth/safe-next-path";

/**
 * For brand-new accounts signing in via portal invite (OTP or OAuth): if `next`
 * targets a project they're invited to (not owner), set profile role to `client`.
 *
 * Matches primary `projects.invite_email` or a pending `project_invites` row.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @param {string | null | undefined} safeNext — already sanitized path or null
 */
export async function applyPortalInviteClientRoleIfNeeded(
  supabase,
  user,
  safeNext
) {
  if (!safeNext || !user?.email) return;

  const projectId = parseProjectIdFromNextPath(safeNext);
  if (!projectId) return;

  const createdAt = user.created_at ? new Date(user.created_at) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return;
  const brandNew = Date.now() - createdAt.getTime() < 120_000;
  if (!brandNew) return;

  const em = normalizeEmail(user.email);
  if (!em) return;

  const { data: proj, error: pErr } = await supabase
    .from("projects")
    .select("id, invite_email, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();

  if (pErr || !proj || proj.freelancer_id === user.id) return;

  const primaryMatch = normalizeEmail(proj.invite_email) === em;

  let stakeholderMatch = false;
  if (!primaryMatch) {
    const { data: invite } = await supabase
      .from("project_invites")
      .select("id")
      .eq("project_id", projectId)
      .eq("status", "pending")
      .ilike("email", em)
      .maybeSingle();
    stakeholderMatch = Boolean(invite?.id);
  }

  if (!primaryMatch && !stakeholderMatch) return;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!prof || prof.role !== "freelancer") return;

  await supabase.from("profiles").update({ role: "client" }).eq("id", user.id);

  // Best-effort membership upsert (RPC is security definer).
  try {
    await supabase.rpc("accept_project_portal_access", {
      p_project_id: projectId,
    });
  } catch {
    /* non-fatal — layout will retry on portal open */
  }
}
