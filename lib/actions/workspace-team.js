"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserFromClaims } from "@/lib/auth/current-user";
import { getActiveWorkspaceForCurrentUser } from "@/lib/data/workspaces";
import { isTeamInvitesEnabled } from "@/lib/teams/feature-flag";
import { loadProjectStaffContext } from "@/lib/teams/access";
import { getAppOrigin } from "@/lib/site-urls";
import { sendWorkspaceInviteViaResend } from "@/lib/email/send-workspace-invite-resend";
import { workspaceDisplayNameFromProfile } from "@/lib/teams/workspace-display-name";
import {
  requirePaidOwnerSubscriptionForWorkspace,
  rollbackAcceptedWorkspaceInvite,
  seatPriceForSubscription,
  syncWorkspaceSeatsToPolar,
} from "@/lib/billing/workspace-seats";
import { hasPaidFreelancerSubscription } from "@/lib/billing/project-limits";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(e) {
  return (e ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function invitesDisabledResponse() {
  return {
    ok: false,
    error: "Inviting teammates isn’t available right now. Please try again later.",
  };
}

function revalidateTeamSurfaces(workspaceId, projectId) {
  revalidatePath("/settings");
  if (workspaceId) revalidatePath(`/settings?tab=members`);
  if (projectId) revalidatePath(`/project/${projectId}/settings`);
}

/**
 * List members + pending invites for the active workspace (manage roles only for mutations).
 */
export async function listWorkspaceTeam() {
  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) {
    return { ok: false, error: "Not signed in", members: [], invites: [], workspace: null };
  }

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId) {
    return { ok: false, error: "No workspace", members: [], invites: [], workspace: null };
  }

  const [{ data: members, error: mErr }, { data: invites, error: iErr }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("id, user_id, role, created_at")
      .eq("workspace_id", active.workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_invites")
      .select("id, email, role, status, project_ids, created_at, invited_by")
      .eq("workspace_id", active.workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (mErr) {
    return { ok: false, error: mErr.message, members: [], invites: [], workspace: active };
  }
  if (iErr) {
    console.error("[workspace-team] invites:", iErr.message);
  }

  const memberUserIds = [...new Set((members ?? []).map((m) => m.user_id).filter(Boolean))];
  let profileById = {};
  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", memberUserIds);
    profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }

  const { data: wsProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("workspace_id", active.workspaceId);
  const projectNameById = Object.fromEntries(
    (wsProjects ?? []).map((p) => [p.id, p.name?.trim() || "Untitled project"])
  );
  const projectIds = Object.keys(projectNameById);

  /** @type {Record<string, { id: string; name: string }[]>} */
  const grantsByUser = {};
  if (memberUserIds.length > 0 && projectIds.length > 0) {
    const { data: grants } = await supabase
      .from("project_staff_access")
      .select("user_id, project_id")
      .in("user_id", memberUserIds)
      .in("project_id", projectIds);
    for (const g of grants ?? []) {
      if (!grantsByUser[g.user_id]) grantsByUser[g.user_id] = [];
      grantsByUser[g.user_id].push({
        id: g.project_id,
        name: projectNameById[g.project_id] || "Project",
      });
    }
  }

  const mappedMembers = (members ?? []).map((m) => {
    const profile = profileById[m.user_id];
    const seesAll = m.role === "owner" || m.role === "admin";
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      createdAt: m.created_at,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      isSelf: m.user_id === user.id,
      seesAllProjects: seesAll,
      projectAccess: seesAll ? [] : grantsByUser[m.user_id] || [],
    };
  });

  /** @type {{ seats: number; dollarsPerSeat: number; planKey: string; founding: boolean; paid: boolean } | null} */
  let seatBilling = null;
  const ownerUserId = active.createdBy;
  if (ownerUserId) {
    const admin = createAdminClient();
    const client = admin ?? supabase;
    const { data: ownerSub } = await client
      .from("freelancer_subscriptions")
      .select("status, plan_key, price_id, seats")
      .eq("user_id", ownerUserId)
      .maybeSingle();
    const price = seatPriceForSubscription(ownerSub);
    seatBilling = {
      seats: Math.max(1, mappedMembers.length || Number(ownerSub?.seats) || 1),
      dollarsPerSeat: price.dollarsPerSeat,
      planKey: price.planKey,
      founding: price.founding,
      paid: hasPaidFreelancerSubscription(ownerSub),
    };
  }

  return {
    ok: true,
    workspace: active,
    invitesEnabled: isTeamInvitesEnabled(),
    members: mappedMembers,
    seatBilling,
    invites: (invites ?? []).map((inv) => {
      const ids = Array.isArray(inv.project_ids) ? inv.project_ids : [];
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        projectIds: ids,
        projectNames: ids.map((id) => projectNameById[id] || "Project"),
        createdAt: inv.created_at,
      };
    }),
  };
}

/**
 * Invite a staff member to the active workspace.
 * @param {{ email: string; role?: 'admin' | 'member'; projectIds?: string[] }} payload
 */
export async function inviteWorkspaceMember(payload) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId || (active.role !== "owner" && active.role !== "admin")) {
    return { ok: false, error: "Not allowed" };
  }

  const email = normalizeEmail(payload?.email);
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email" };

  const paidGate = await requirePaidOwnerSubscriptionForWorkspace(active.workspaceId);
  if (!paidGate.ok) return { ok: false, error: paidGate.error };

  const role = payload?.role === "admin" ? "admin" : "member";
  if (role === "admin" && active.role !== "owner") {
    return { ok: false, error: "Only the owner can invite admins" };
  }

  let projectIds = Array.isArray(payload?.projectIds)
    ? [...new Set(payload.projectIds.filter(Boolean))]
    : [];

  if (role === "member") {
    if (projectIds.length === 0) {
      return { ok: false, error: "Pick at least one project for members" };
    }
    const { data: ownedProjects, error: pErr } = await supabase
      .from("projects")
      .select("id")
      .eq("workspace_id", active.workspaceId)
      .in("id", projectIds);
    if (pErr) return { ok: false, error: pErr.message };
    const allowed = new Set((ownedProjects ?? []).map((p) => p.id));
    projectIds = projectIds.filter((id) => allowed.has(id));
    if (projectIds.length === 0) {
      return { ok: false, error: "Selected projects are not in this workspace" };
    }
  } else {
    projectIds = [];
  }

  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", active.workspaceId);
  const existingIds = (existingMember ?? []).map((m) => m.user_id).filter(Boolean);
  if (existingIds.length > 0) {
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", existingIds);
    const alreadyIn = (existingProfiles ?? []).some(
      (p) => normalizeEmail(p.email) === email
    );
    if (alreadyIn) return { ok: false, error: "That person is already a member" };
  }

  const { data: invite, error } = await supabase
    .from("workspace_invites")
    .insert({
      workspace_id: active.workspaceId,
      email,
      role,
      invited_by: user.id,
      status: "pending",
      project_ids: projectIds,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "An invite is already pending for that email" };
    }
    return { ok: false, error: error.message };
  }

  const origin = getAppOrigin() || "";
  // Path-only invite URL so login `next=` never nests query params (which drop after `?`).
  const acceptUrl = `${origin}/invite/workspace/${invite.id}`;
  const hasResend = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim()
  );

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, title, role")
    .eq("id", user.id)
    .maybeSingle();

  const inviterName =
    inviterProfile?.full_name?.trim() ||
    (typeof user.email === "string" ? user.email.split("@")[0] : null) ||
    "A teammate";
  const inviterRoleLine =
    inviterProfile?.title?.trim() ||
    (inviterProfile?.role === "client" ? "Client" : "Freelancer");
  const workspaceName =
    active.name && active.name.trim() && active.name.trim().toLowerCase() !== "personal"
      ? active.name.trim()
      : workspaceDisplayNameFromProfile(
          inviterProfile?.full_name,
          inviterProfile?.email || user.email
        );

  // Keep workspace label readable if it was still the old default
  if (active.name?.trim().toLowerCase() === "personal") {
    await supabase
      .from("workspaces")
      .update({ name: workspaceName })
      .eq("id", active.workspaceId);
  }

  let projectNames = [];
  if (role === "member" && projectIds.length > 0) {
    const { data: named } = await supabase
      .from("projects")
      .select("id, name")
      .eq("workspace_id", active.workspaceId)
      .in("id", projectIds);
    projectNames = (named ?? []).map((p) => p.name?.trim() || "Untitled project");
  }

  if (hasResend) {
    const sent = await sendWorkspaceInviteViaResend({
      to: email,
      acceptUrl,
      inviterName,
      inviterRoleLine,
      inviterAvatarUrl: inviterProfile?.avatar_url ?? null,
      workspaceName,
      role,
      projectNames,
    });
    if (!sent.ok) {
      return {
        ok: true,
        id: invite.id,
        warning: sent.error || "Invite saved but email failed to send",
      };
    }
  } else if (process.env.NODE_ENV === "development") {
    console.info("[workspace-invite] skipped email; accept URL:", acceptUrl);
  }

  revalidateTeamSurfaces(active.workspaceId);
  return { ok: true, id: invite.id, skippedEmail: !hasResend };
}

export async function revokeWorkspaceInvite(inviteId) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId || (active.role !== "owner" && active.role !== "admin")) {
    return { ok: false, error: "Not allowed" };
  }

  const { error } = await supabase
    .from("workspace_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("workspace_id", active.workspaceId)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidateTeamSurfaces(active.workspaceId);
  return { ok: true };
}

function friendlyAcceptInviteError(codeOrMessage) {
  const raw = String(codeOrMessage || "").trim();
  const key = raw.toLowerCase();
  if (key === "email_mismatch") {
    return "This invite was sent to a different email than the one you’re signed in with.";
  }
  if (key === "invite_not_found") {
    return "Invite not found. Ask the owner to send a new invite.";
  }
  if (key === "invite_not_pending") {
    return "This invite is no longer pending.";
  }
  if (key === "not_signed_in") {
    return "Not signed in";
  }
  return raw || "Could not accept invite";
}

export async function acceptWorkspaceInviteAction(inviteId) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const id = typeof inviteId === "string" ? inviteId.trim() : "";
  if (!id) return { ok: false, error: "Missing invite" };

  // RPC matches invite email against profiles.email — keep it in sync with auth.
  const authEmail = normalizeEmail(user.email);
  if (authEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();
    if (normalizeEmail(profile?.email) !== authEmail) {
      await supabase.from("profiles").update({ email: authEmail }).eq("id", user.id);
    }
  }

  const { data, error } = await supabase.rpc("accept_workspace_invite", {
    p_invite_id: id,
  });

  if (error) return { ok: false, error: friendlyAcceptInviteError(error.message) };
  const payload = data && typeof data === "object" ? data : {};
  if (payload.ok === false) {
    return {
      ok: false,
      error: friendlyAcceptInviteError(payload.error || "Could not accept invite"),
    };
  }

  const workspaceId = payload.workspace_id ? String(payload.workspace_id) : null;

  // Already a member: no new seat to bill.
  if (!payload.already && workspaceId) {
    const seatSync = await syncWorkspaceSeatsToPolar(workspaceId);
    if (!seatSync.ok) {
      await rollbackAcceptedWorkspaceInvite({
        workspaceId,
        userId: user.id,
        inviteId: id,
      });
      return {
        ok: false,
        error:
          "Couldn't add billing seat — ask the owner to update their payment method, then try accepting again.",
      };
    }
  }

  if (workspaceId) {
    const { setActiveWorkspace } = await import("@/lib/actions/active-workspace");
    await setActiveWorkspace(workspaceId);
  }

  revalidateTeamSurfaces(workspaceId);
  return { ok: true, ...payload };
}

/**
 * @param {{ memberUserId: string; role: 'admin' | 'member' }} payload
 */
export async function updateWorkspaceMemberRole(payload) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId || active.role !== "owner") {
    return { ok: false, error: "Only the owner can change roles" };
  }

  const memberUserId = payload?.memberUserId;
  const role = payload?.role === "admin" ? "admin" : "member";
  if (!memberUserId || memberUserId === user.id) {
    return { ok: false, error: "Invalid member" };
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", active.workspaceId)
    .eq("user_id", memberUserId)
    .neq("role", "owner");

  if (error) return { ok: false, error: error.message };
  revalidateTeamSurfaces(active.workspaceId);
  return { ok: true };
}

export async function removeWorkspaceMember(memberUserId) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId || (active.role !== "owner" && active.role !== "admin")) {
    return { ok: false, error: "Not allowed" };
  }

  if (!memberUserId || memberUserId === user.id) {
    return { ok: false, error: "You cannot remove yourself this way" };
  }

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", active.workspaceId)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Member not found" };
  if (target.role === "owner") return { ok: false, error: "Cannot remove the owner" };
  if (target.role === "admin" && active.role !== "owner") {
    return { ok: false, error: "Only the owner can remove admins" };
  }

  const { error: delMem } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", active.workspaceId)
    .eq("user_id", memberUserId);

  if (delMem) return { ok: false, error: delMem.message };

  const { data: wsProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", active.workspaceId);
  const projectIds = (wsProjects ?? []).map((p) => p.id).filter(Boolean);
  if (projectIds.length > 0) {
    await supabase
      .from("project_staff_access")
      .delete()
      .eq("user_id", memberUserId)
      .in("project_id", projectIds);
  }

  const seatSync = await syncWorkspaceSeatsToPolar(active.workspaceId);
  if (!seatSync.ok) {
    console.error("[workspace-team] seat decrease after remove:", seatSync.error);
    // Member is already removed; surface billing follow-up without undoing removal.
    revalidateTeamSurfaces(active.workspaceId);
    return {
      ok: true,
      warning:
        seatSync.error ||
        "Member removed, but billed seats could not be updated. Check Settings → Subscription.",
    };
  }

  revalidateTeamSurfaces(active.workspaceId);
  return { ok: true };
}

/**
 * Project staff grants (Slack-style channels).
 * @param {string} projectId
 */
export async function listProjectStaffAccess(projectId) {
  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in", rows: [] };

  const staff = await loadProjectStaffContext(supabase, projectId, user.id);
  if (!staff.canManage) return { ok: false, error: "Not allowed", rows: [] };

  const workspaceId = staff.project?.workspace_id;
  const [{ data: grants }, { data: members }] = await Promise.all([
    supabase
      .from("project_staff_access")
      .select("id, user_id, created_at")
      .eq("project_id", projectId),
    workspaceId
      ? supabase
          .from("workspace_members")
          .select("user_id, role")
          .eq("workspace_id", workspaceId)
      : Promise.resolve({ data: [] }),
  ]);

  const userIds = [
    ...new Set([
      ...(grants ?? []).map((g) => g.user_id),
      ...(members ?? []).map((m) => m.user_id),
    ].filter(Boolean)),
  ];
  let profileById = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);
    profileById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }

  return {
    ok: true,
    invitesEnabled: isTeamInvitesEnabled(),
    grants: (grants ?? []).map((g) => {
      const profile = profileById[g.user_id];
      return {
        id: g.id,
        userId: g.user_id,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      };
    }),
    members: (members ?? [])
      .filter((m) => m.role === "member")
      .map((m) => {
        const profile = profileById[m.user_id];
        return {
          userId: m.user_id,
          role: m.role,
          fullName: profile?.full_name ?? null,
          email: profile?.email ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        };
      }),
  };
}

/**
 * @param {string} projectId
 * @param {string} memberUserId
 */
export async function grantProjectStaffAccess(projectId, memberUserId) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const staff = await loadProjectStaffContext(supabase, projectId, user.id);
  if (!staff.canManage || !staff.project?.workspace_id) {
    return { ok: false, error: "Not allowed" };
  }

  const { data: mem } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", staff.project.workspace_id)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (!mem || mem.role !== "member") {
    return { ok: false, error: "Only workspace members need project grants" };
  }

  const { error } = await supabase.from("project_staff_access").upsert(
    {
      project_id: projectId,
      user_id: memberUserId,
      granted_by: user.id,
    },
    { onConflict: "project_id,user_id" }
  );

  if (error) return { ok: false, error: error.message };
  revalidateTeamSurfaces(staff.project.workspace_id, projectId);
  return { ok: true };
}

export async function revokeProjectStaffAccess(projectId, memberUserId) {
  if (!isTeamInvitesEnabled()) return invitesDisabledResponse();

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const staff = await loadProjectStaffContext(supabase, projectId, user.id);
  if (!staff.canManage) return { ok: false, error: "Not allowed" };

  const { error } = await supabase
    .from("project_staff_access")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", memberUserId);

  if (error) return { ok: false, error: error.message };
  revalidateTeamSurfaces(staff.project?.workspace_id, projectId);
  return { ok: true };
}

/**
 * Projects in active workspace (for invite project picker).
 */
export async function listWorkspaceProjectsForInvite() {
  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in", projects: [] };

  const active = await getActiveWorkspaceForCurrentUser();
  if (!active?.workspaceId || (active.role !== "owner" && active.role !== "admin")) {
    return { ok: false, error: "Not allowed", projects: [] };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, logo_url, client_name_snapshot")
    .eq("workspace_id", active.workspaceId)
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message, projects: [] };

  const projects = (data ?? []).map((row) => {
    const status = row.status;
    let statusLabel = "Active";
    if (status === "on_hold") statusLabel = "On Hold";
    else if (status === "draft") statusLabel = "Draft";
    else if (status === "completed") statusLabel = "Completed";
    else if (typeof status === "string" && status.length > 0) {
      statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
    }
    const logoUrl =
      row.logo_url && String(row.logo_url).startsWith("http") ? row.logo_url : null;
    return {
      id: row.id,
      name: row.name,
      status: statusLabel,
      statusKey: status,
      logoUrl,
      clientName:
        typeof row.client_name_snapshot === "string"
          ? row.client_name_snapshot.trim() || null
          : null,
    };
  });

  return { ok: true, projects };
}

