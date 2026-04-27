"use server";

import { createClient } from "@/lib/supabase/server";
import { buildPortalInviteLoginUrl } from "@/lib/invites/project-portal-invite";
import {
  defaultMablyEmailLogoUrl,
  sendPortalInviteViaResend,
} from "@/lib/email/send-portal-invite-resend";

/**
 * Called after a project is created (or when re-sending an invite).
 * Sends via Resend when `RESEND_API_KEY` and `RESEND_FROM` are set; otherwise logs in dev only.
 *
 * @param {{ projectId: string, toEmail: string | null | undefined }} params
 */
export async function sendPortalInviteEmail({ projectId, toEmail }) {
  const email = typeof toEmail === "string" ? toEmail.trim() : "";
  if (!projectId || !email) {
    return { ok: false, error: "Missing project or email" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: row, error } = await supabase
    .from("projects")
    .select(
      "id, freelancer_id, name, invite_email, freelancer_display_name, freelancer_avatar_url"
    )
    .eq("id", projectId)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, error: "Project not found" };
  }

  if (normalize(row.invite_email) !== normalize(email)) {
    return { ok: false, error: "Invite email does not match this project" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, title, role")
    .eq("id", user.id)
    .maybeSingle();

  const loginUrl = buildPortalInviteLoginUrl(projectId);
  const subject = `You're invited to ${row.name?.trim() || "a project"} portal`;
  const freelancerName =
    row.freelancer_display_name?.trim() ||
    profile?.full_name?.trim() ||
    "Your freelancer";
  const freelancerAvatarUrl =
    row.freelancer_avatar_url?.trim() || profile?.avatar_url?.trim() || null;
  const freelancerRoleLine =
    profile?.title?.trim() ||
    (profile?.role === "client" ? "Client" : "Freelancer");
  const projectName = row.name?.trim() || "a project";
  const logoUrl = defaultMablyEmailLogoUrl();

  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());

  if (!hasResend) {
    if (process.env.NODE_ENV === "development") {
      console.info("[invite] Resend not configured (set RESEND_API_KEY + RESEND_FROM). Skipping send.");
      console.info("  To:", email);
      console.info("  Subject:", subject);
      console.info("  CTA URL:", loginUrl);
    }
    return { ok: true, loginUrl, subject, skipped: true };
  }

  const sent = await sendPortalInviteViaResend({
    to: email,
    subject,
    loginUrl,
    projectName,
    freelancerName,
    freelancerRoleLine,
    freelancerAvatarUrl,
    logoUrl,
  });

  if (!sent.ok) {
    return { ok: false, error: sent.error, loginUrl, subject };
  }

  return { ok: true, loginUrl, subject, messageId: sent.messageId };
}

function normalize(e) {
  return (e ?? "").trim().toLowerCase();
}
