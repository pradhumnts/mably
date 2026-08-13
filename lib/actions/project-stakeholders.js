"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPortalInviteLoginUrl } from "@/lib/invites/project-portal-invite";
import {
  defaultMablyEmailLogoUrl,
  sendPortalInviteViaResend,
} from "@/lib/email/send-portal-invite-resend";

const MAX_EXTRA_STAKEHOLDERS = 20;

function normalizeEmail(e) {
  return (e ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Ensure signed-in invitee gets a project_members client row when eligible.
 * @param {string} projectId
 */
export async function ensureProjectPortalMembership(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase.rpc("accept_project_portal_access", {
    p_project_id: pid,
  });

  if (error) {
    console.error("[stakeholders] accept_project_portal_access:", error.message);
    return { ok: false, error: error.message };
  }

  const payload = data && typeof data === "object" ? data : {};
  if (payload.ok === false) {
    return { ok: false, error: String(payload.error || "Could not join project") };
  }
  return { ok: true, ...payload };
}

/**
 * @param {string} projectId
 */
export async function listProjectStakeholders(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project", primary: null, members: [], invites: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in", primary: null, members: [], invites: [] };
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, freelancer_id, invite_email, client_name_snapshot, client_email_snapshot, client_avatar_snapshot"
    )
    .eq("id", pid)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (pErr || !project) {
    return {
      ok: false,
      error: pErr?.message || "Project not found",
      primary: null,
      members: [],
      invites: [],
    };
  }

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("project_members")
      .select("id, user_id, role, created_at")
      .eq("project_id", pid)
      .eq("role", "client")
      .order("created_at", { ascending: true }),
    supabase
      .from("project_invites")
      .select("id, email, status, created_at, accepted_at, accepted_user_id")
      .eq("project_id", pid)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: true }),
  ]);

  const memberRows = members ?? [];
  const userIds = memberRows.map((m) => m.user_id).filter(Boolean);
  /** @type {Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>} */
  let profilesById = {};
  if (userIds.length > 0) {
    // Freelancer cannot read other profiles under RLS — use service role when available.
    const reader = createAdminClient() || supabase;
    const { data: profiles } = await reader
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profilesById[p.id] = p;
    }
  }

  const primaryEmail = normalizeEmail(project.invite_email);
  const mappedMembers = memberRows.map((m) => {
    const prof = profilesById[m.user_id] || {};
    const email = normalizeEmail(prof.email);
    return {
      id: m.id,
      userId: m.user_id,
      email: email || null,
      name: (prof.full_name || "").trim() || null,
      avatar: prof.avatar_url || null,
      joinedAt: m.created_at,
      isPrimary: Boolean(primaryEmail && email === primaryEmail),
    };
  });

  const inviteRows = (invites ?? []).map((inv) => ({
    id: inv.id,
    email: normalizeEmail(inv.email),
    status: inv.status,
    createdAt: inv.created_at,
    acceptedAt: inv.accepted_at,
    acceptedUserId: inv.accepted_user_id,
    isPrimary: false,
  }));

  return {
    ok: true,
    primary: primaryEmail
      ? {
          email: primaryEmail,
          name: (project.client_name_snapshot || "").trim() || null,
          avatar: project.client_avatar_snapshot || null,
          hasJoined: mappedMembers.some((m) => m.isPrimary),
        }
      : null,
    members: mappedMembers,
    invites: inviteRows.filter((i) => i.status === "pending"),
    maxExtra: MAX_EXTRA_STAKEHOLDERS,
  };
}

/**
 * Invite an additional client/stakeholder (not the primary invite_email replace flow).
 * @param {string} projectId
 * @param {string} email
 */
export async function inviteProjectStakeholder(projectId, email) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const em = normalizeEmail(email);
  if (!pid || !em) return { ok: false, error: "Project and email are required" };
  if (!isValidEmail(em)) return { ok: false, error: "Enter a valid email address" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, freelancer_id, name, invite_email, freelancer_display_name, freelancer_avatar_url"
    )
    .eq("id", pid)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (pErr || !project) {
    return { ok: false, error: "Project not found" };
  }

  if (normalizeEmail(user.email) === em) {
    return { ok: false, error: "You can't invite yourself" };
  }

  if (normalizeEmail(project.invite_email) === em) {
    return {
      ok: false,
      error: "That email is already the primary client on this project",
    };
  }

  const { data: existingMembers } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", pid)
    .eq("role", "client");

  const memberIds = (existingMembers ?? []).map((m) => m.user_id);
  if (memberIds.length > 0) {
    const reader = createAdminClient() || supabase;
    const { data: profiles } = await reader
      .from("profiles")
      .select("id, email")
      .in("id", memberIds);
    if ((profiles ?? []).some((p) => normalizeEmail(p.email) === em)) {
      return { ok: false, error: "That person already has access" };
    }
  }

  const { count: pendingCount } = await supabase
    .from("project_invites")
    .select("id", { count: "exact", head: true })
    .eq("project_id", pid)
    .eq("status", "pending");

  const extraJoined = (existingMembers ?? []).length;
  if ((pendingCount ?? 0) + extraJoined >= MAX_EXTRA_STAKEHOLDERS + 1) {
    return {
      ok: false,
      error: `You can invite up to ${MAX_EXTRA_STAKEHOLDERS} extra people on a project`,
    };
  }

  const { data: existingPending } = await supabase
    .from("project_invites")
    .select("id")
    .eq("project_id", pid)
    .eq("status", "pending")
    .ilike("email", em)
    .maybeSingle();

  if (existingPending?.id) {
    const sent = await sendStakeholderInviteEmail({
      supabase,
      user,
      project,
      toEmail: em,
    });
    return sent.ok
      ? { ok: true, resent: true, inviteId: existingPending.id }
      : { ok: false, error: sent.error || "Could not resend invite" };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("project_invites")
    .insert({
      project_id: pid,
      email: em,
      invited_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr) {
    console.error("[stakeholders] insert invite:", insErr.message);
    return { ok: false, error: insErr.message };
  }

  const sent = await sendStakeholderInviteEmail({
    supabase,
    user,
    project,
    toEmail: em,
  });

  if (!sent.ok) {
    return {
      ok: true,
      inviteId: inserted.id,
      emailSkipped: true,
      warning: sent.error || "Invite saved but email could not be sent",
    };
  }

  return { ok: true, inviteId: inserted.id };
}

/**
 * @param {string} projectId
 * @param {string} inviteId
 */
export async function resendProjectStakeholderInvite(projectId, inviteId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const iid = typeof inviteId === "string" ? inviteId.trim() : "";
  if (!pid || !iid) return { ok: false, error: "Missing invite" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, freelancer_id, name, invite_email, freelancer_display_name, freelancer_avatar_url"
    )
    .eq("id", pid)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (!project) return { ok: false, error: "Project not found" };

  const { data: invite } = await supabase
    .from("project_invites")
    .select("id, email, status")
    .eq("id", iid)
    .eq("project_id", pid)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    return { ok: false, error: "Invite not found" };
  }

  return sendStakeholderInviteEmail({
    supabase,
    user,
    project,
    toEmail: invite.email,
  });
}

/**
 * Remove a pending invite or revoke an accepted client member (not primary contact).
 * @param {string} projectId
 * @param {{ inviteId?: string; memberUserId?: string }} target
 */
export async function revokeProjectStakeholder(projectId, target) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: project } = await supabase
    .from("projects")
    .select("id, freelancer_id, invite_email")
    .eq("id", pid)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (!project) return { ok: false, error: "Project not found" };

  const primaryEmail = normalizeEmail(project.invite_email);

  if (target?.inviteId) {
    const { error } = await supabase
      .from("project_invites")
      .update({ status: "revoked" })
      .eq("id", target.inviteId)
      .eq("project_id", pid)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  if (target?.memberUserId) {
    const reader = createAdminClient() || supabase;
    const { data: prof } = await reader
      .from("profiles")
      .select("email")
      .eq("id", target.memberUserId)
      .maybeSingle();
    if (primaryEmail && normalizeEmail(prof?.email) === primaryEmail) {
      return {
        ok: false,
        error: "The primary client can't be removed here. Change their invite email instead.",
      };
    }

    const { error: delErr } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", pid)
      .eq("user_id", target.memberUserId)
      .eq("role", "client");

    if (delErr) return { ok: false, error: delErr.message };

    if (prof?.email) {
      await supabase
        .from("project_invites")
        .update({ status: "revoked" })
        .eq("project_id", pid)
        .ilike("email", normalizeEmail(prof.email))
        .in("status", ["pending", "accepted"]);
    }

    return { ok: true };
  }

  return { ok: false, error: "Nothing to revoke" };
}

/**
 * @param {{
 *   supabase: import("@supabase/supabase-js").SupabaseClient;
 *   user: { id: string };
 *   project: {
 *     id: string;
 *     name?: string | null;
 *     freelancer_display_name?: string | null;
 *     freelancer_avatar_url?: string | null;
 *   };
 *   toEmail: string;
 * }} args
 */
async function sendStakeholderInviteEmail({ supabase, user, project, toEmail }) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, title, role")
    .eq("id", user.id)
    .maybeSingle();

  const loginUrl = buildPortalInviteLoginUrl(project.id);
  const projectName = project.name?.trim() || "a project";
  const subject = `You're invited to ${projectName} portal`;
  const freelancerName =
    project.freelancer_display_name?.trim() ||
    profile?.full_name?.trim() ||
    "Your freelancer";
  const freelancerAvatarUrl =
    project.freelancer_avatar_url?.trim() || profile?.avatar_url?.trim() || null;
  const freelancerRoleLine =
    profile?.title?.trim() ||
    (profile?.role === "client" ? "Client" : "Freelancer");
  const logoUrl = defaultMablyEmailLogoUrl();

  const hasResend = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim()
  );

  if (!hasResend) {
    if (process.env.NODE_ENV === "development") {
      console.info("[stakeholder-invite] Resend not configured. Skipping send.");
      console.info("  To:", toEmail);
      console.info("  CTA URL:", loginUrl);
    }
    return { ok: true, skipped: true, loginUrl };
  }

  const sent = await sendPortalInviteViaResend({
    to: toEmail,
    subject,
    loginUrl,
    projectName,
    freelancerName,
    freelancerRoleLine,
    freelancerAvatarUrl,
    logoUrl,
  });

  if (!sent.ok) {
    return { ok: false, error: sent.error, loginUrl };
  }
  return { ok: true, messageId: sent.messageId, loginUrl };
}
