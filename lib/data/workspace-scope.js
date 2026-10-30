import {
  canManageWorkspaceRole,
  ensurePersonalWorkspaceId,
  getActiveWorkspaceForCurrentUser,
} from "@/lib/data/workspaces";

/**
 * Resolve how CRM / project lists should be scoped for the signed-in staff user.
 * Prefer workspace_id for owner/admin; members rely on RLS + grants; legacy fallback
 * keeps freelancer_id if workspace rows are missing (pre-migration safety).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ id: string }} user
 * @returns {Promise<{
 *   mode: 'workspace' | 'member' | 'legacy';
 *   workspaceId: string | null;
 *   role: string | null;
 *   userId: string;
 * }>}
 */
export async function resolveStaffDataScope(supabase, user) {
  if (!user?.id) {
    return { mode: "legacy", workspaceId: null, role: null, userId: "" };
  }

  let active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId) {
    const ensured = await ensurePersonalWorkspaceId(supabase, user.id);
    if (ensured) {
      active = {
        workspaceId: ensured,
        name: "Workspace",
        role: "owner",
        createdBy: user.id,
      };
    }
  }

  if (active?.workspaceId && canManageWorkspaceRole(active.role)) {
    return {
      mode: "workspace",
      workspaceId: active.workspaceId,
      role: active.role,
      userId: user.id,
    };
  }

  if (active?.workspaceId && active.role === "member") {
    return {
      mode: "member",
      workspaceId: active.workspaceId,
      role: active.role,
      userId: user.id,
    };
  }

  return {
    mode: "legacy",
    workspaceId: active?.workspaceId ?? null,
    role: active?.role ?? null,
    userId: user.id,
  };
}

/**
 * Apply staff list scope to a Supabase query builder on clients/projects.
 * Members: no extra filter (RLS + grants). Owner/admin: workspace_id.
 * Legacy: freelancer_id.
 *
 * @template T
 * @param {T} query
 * @param {{ mode: string, workspaceId: string | null, userId: string }} scope
 * @returns {T}
 */
export function applyStaffOwnedFilter(query, scope) {
  if (scope.mode === "workspace" && scope.workspaceId) {
    return query.eq("workspace_id", scope.workspaceId);
  }
  if (scope.mode === "member") {
    return query;
  }
  return query.eq("freelancer_id", scope.userId);
}
