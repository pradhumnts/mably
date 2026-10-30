import { createClient } from "@/lib/supabase/server";
import { canManageWorkspaceRole } from "@/lib/data/workspaces";

/**
 * Pure staff access matrix (Gate 2). Used by app + tests — keep in sync with SQL helpers.
 * @param {{ legacyOwner?: boolean; role?: string | null; hasGrant?: boolean }} input
 */
export function resolveStaffProjectAccess(input) {
  const legacyOwner = Boolean(input?.legacyOwner);
  const role = input?.role ?? null;
  const hasGrant = Boolean(input?.hasGrant);
  const isManager = legacyOwner || canManageWorkspaceRole(role);
  const canAccess = isManager || (role === "member" && hasGrant);
  return { isManager, canManage: isManager, canAccess, hasGrant };
}

/**
 * Staff access check for a project (owner/admin of workspace, legacy freelancer, or grant).
 * Prefer DB helpers when mutating; this is for app-layer branching.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} projectId
 * @param {string} userId
 */
export async function loadProjectStaffContext(supabase, projectId, userId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, freelancer_id, workspace_id, client_id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: error?.message || "Project not found", project: null };
  }

  const legacyOwner = project.freelancer_id === userId;

  let role = null;
  if (project.workspace_id) {
    const { data: mem } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", project.workspace_id)
      .eq("user_id", userId)
      .maybeSingle();
    role = mem?.role ?? null;
  }

  let hasGrant = false;
  if (!legacyOwner && !canManageWorkspaceRole(role) && role === "member") {
    const { data: grant } = await supabase
      .from("project_staff_access")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    hasGrant = Boolean(grant?.id);
  }

  const access = resolveStaffProjectAccess({ legacyOwner, role, hasGrant });

  return {
    ok: access.canAccess,
    project,
    role,
    legacyOwner,
    canAccess: access.canAccess,
    canManage: access.canManage,
    hasGrant: access.hasGrant,
  };
}

/**
 * @param {string} projectId
 * @param {string} userId
 */
export async function requireProjectStaffManage(projectId, userId) {
  const supabase = await createClient();
  const ctx = await loadProjectStaffContext(supabase, projectId, userId);
  if (!ctx.ok || !ctx.canManage) {
    return { ok: false, error: "Not allowed", supabase, ctx };
  }
  return { ok: true, supabase, ctx };
}
