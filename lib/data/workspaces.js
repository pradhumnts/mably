import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/teams/active-workspace-cookie";

/**
 * @typedef {{
 *   workspaceId: string;
 *   name: string;
 *   role: 'owner' | 'admin' | 'member';
 *   createdBy: string;
 *   ownerName: string | null;
 *   ownerAvatarUrl: string | null;
 * }} WorkspaceMembership
 */

/**
 * Ensure the signed-in user has a personal owned workspace (idempotent RPC).
 * @param {import("@supabase/supabase-js").SupabaseClient} [supabase]
 * @param {string} [userId]
 * @returns {Promise<string | null>}
 */
export async function ensurePersonalWorkspaceId(supabase, userId) {
  const client = supabase ?? (await createClient());
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return null;

  const { data, error } = await client.rpc("ensure_personal_workspace", { u: uid });
  if (error) {
    console.error("[workspaces] ensure_personal_workspace:", error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

/**
 * @param {any} row
 * @param {{ full_name?: string | null; avatar_url?: string | null } | null} [ownerProfile]
 * @returns {WorkspaceMembership | null}
 */
function mapMembershipRow(row, ownerProfile = null) {
  if (!row?.workspace_id) return null;
  const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
  const role =
    row.role === "owner" || row.role === "admin" || row.role === "member"
      ? row.role
      : "member";
  return {
    workspaceId: row.workspace_id,
    name: ws?.name?.trim() || "Workspace",
    role,
    createdBy: ws?.created_by ?? "",
    ownerName: ownerProfile?.full_name?.trim() || null,
    ownerAvatarUrl: ownerProfile?.avatar_url?.trim() || null,
  };
}

/**
 * All workspaces the signed-in user belongs to (owned + invited).
 * Avatar is the workspace owner's profile photo (no workspace branding settings yet).
 * @returns {Promise<WorkspaceMembership[]>}
 */
export const listWorkspacesForCurrentUser = cache(async () => {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return [];

  await ensurePersonalWorkspaceId(supabase, user.id);

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, created_at, workspaces ( id, name, created_by )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[workspaces] list:", error.message);
    return [];
  }

  const rows = data ?? [];
  const ownerIds = [
    ...new Set(
      rows
        .map((row) => {
          const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
          return ws?.created_by;
        })
        .filter(Boolean)
    ),
  ];

  /** @type {Record<string, { full_name?: string | null; avatar_url?: string | null }>} */
  let ownersById = {};
  if (ownerIds.length > 0) {
    const { data: owners, error: ownersErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ownerIds);
    if (ownersErr) {
      console.error("[workspaces] owners:", ownersErr.message);
    } else {
      ownersById = Object.fromEntries((owners ?? []).map((p) => [p.id, p]));
    }
  }

  return rows
    .map((row) => {
      const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
      return mapMembershipRow(row, ownersById[ws?.created_by] || null);
    })
    .filter(Boolean);
});

/**
 * Active workspace for the session.
 * Honors mably_active_workspace_id cookie when the user is a member of that workspace.
 * Otherwise prefers owned workspace, then first membership.
 * @returns {Promise<WorkspaceMembership | null>}
 */
export const getActiveWorkspaceForCurrentUser = cache(async () => {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return null;

  const memberships = await listWorkspacesForCurrentUser();
  if (memberships.length === 0) {
    const ensured = await ensurePersonalWorkspaceId(supabase, user.id);
    if (!ensured) return null;
    const { data: row } = await supabase
      .from("workspaces")
      .select("id, name, created_by")
      .eq("id", ensured)
      .maybeSingle();
    return {
      workspaceId: ensured,
      name: row?.name ?? "Workspace",
      role: "owner",
      createdBy: row?.created_by ?? user.id,
      ownerName: null,
      ownerAvatarUrl: null,
    };
  }

  let preferredId = null;
  try {
    const jar = await cookies();
    preferredId = jar.get(ACTIVE_WORKSPACE_COOKIE)?.value?.trim() || null;
  } catch {
    preferredId = null;
  }

  if (preferredId) {
    const match = memberships.find((m) => m.workspaceId === preferredId);
    if (match) return match;
  }

  const owned = memberships.find((m) => m.role === "owner");
  return owned || memberships[0] || null;
});

/**
 * @param {string} workspaceId
 * @param {string} userId
 */
export async function getWorkspaceRole(workspaceId, userId) {
  if (!workspaceId || !userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[workspaces] getWorkspaceRole:", error.message);
    return null;
  }
  return data?.role ?? null;
}

export function canManageWorkspaceRole(role) {
  return role === "owner" || role === "admin";
}
