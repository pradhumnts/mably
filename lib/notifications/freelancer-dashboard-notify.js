import { createClient } from "@/lib/supabase/server";
import { getAuthProviderAvatarUrl } from "@/lib/auth/user-avatar-url";
import { defaultMablyEmailLogoUrl } from "@/lib/email/send-portal-invite-resend";
import {
  absoluteUrlForPath,
  buildPortalTransactionalEmailHtml,
} from "@/lib/email/portal-transactional-email-html";
import { sendPortalTransactionalEmail } from "@/lib/email/send-portal-transactional-resend";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";
import { fetchProjectNotificationTargets } from "@/lib/notifications/project-notification-targets";

function hasResend() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim()
  );
}

function invoiceNoLabel(id) {
  const compact = String(id).replace(/-/g, "");
  return `#${compact.slice(0, 8).toUpperCase()}`;
}

/**
 * @param {{ to: string; headline: string; actorName: string; actorRoleLine: string; actorAvatarUrl: string | null; bodyLines: string[]; ctaPath: string; ctaLabel: string; projectName: string }} p
 */
async function sendFreelancerDashboardEmail(p) {
  if (!hasResend()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[notifications] Resend not configured — skipping freelancer dashboard email.");
    }
    return { ok: false, error: "Resend not configured" };
  }

  const logoUrl = defaultMablyEmailLogoUrl();
  const ctaUrl = absoluteUrlForPath(p.ctaPath);
  const subject = `${p.headline} — ${p.projectName || "Project"}`;
  const html = buildPortalTransactionalEmailHtml({
    logoUrl,
    headline: p.headline,
    actorName: p.actorName,
    actorRoleLine: p.actorRoleLine,
    actorAvatarUrl: p.actorAvatarUrl,
    bodyParagraphs: p.bodyLines,
    ctaLabel: p.ctaLabel,
    ctaUrl,
    footerNote: `You’re receiving this because you’re using Mably for “${p.projectName}”.`,
  });

  const r = await sendPortalTransactionalEmail({ to: p.to, subject, html });
  if (!r.ok) {
    console.error("[notifications] freelancer dashboard send failed:", p.to, r.error);
  }
  return r;
}

/**
 * Email the signed-in freelancer after they create a project (Settings → projectCreated).
 *
 * @param {{ projectId: string; projectName: string }} p
 */
export async function notifyFreelancerProjectCreated(p) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const pid = typeof p.projectId === "string" ? p.projectId.trim() : "";
    if (!pid) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email, notification_preferences")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) return;

    const prefs = mergeAllNotificationPreferences(profile.notification_preferences);
    if (prefs.projectCreated === false) return;

    const to = (profile.email ?? user.email ?? "").trim();
    if (!to) return;

    const projectName =
      typeof p.projectName === "string" ? p.projectName.trim() || "Project" : "Project";

    const name =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      to.split("@")[0] ||
      "You";

    const sent = await sendFreelancerDashboardEmail({
      to,
      headline: "New project created",
      actorName: name,
      actorRoleLine: "Freelancer",
      actorAvatarUrl: getAuthProviderAvatarUrl(user),
      bodyLines: [
        `You created “${projectName}”.`,
        "Open the project dashboard to invite your client, share files, and track work.",
      ],
      ctaPath: `/project/${pid}/dashboard`,
      ctaLabel: "Open project",
      projectName,
    });
    if (!sent.ok) return;
  } catch (e) {
    console.error("[notifications] notifyFreelancerProjectCreated:", e);
  }
}

/**
 * Email the freelancer when a client opens the portal for the first time (Settings → clientOpenedPortal).
 *
 * @param {{
 *   projectId: string;
 *   projectName: string;
 *   clientUserId: string;
 *   clientName: string;
 *   clientAvatarUrl: string | null;
 * }} p
 */
export async function notifyFreelancerClientOpenedPortal(p) {
  try {
    const targets = await fetchProjectNotificationTargets(p.projectId);
    const freelancer = targets.find((t) => t.roleLine === "Freelancer");
    if (!freelancer?.email) return;

    if (freelancer.prefs.clientOpenedPortal === false) return;

    const projectName =
      typeof p.projectName === "string" ? p.projectName.trim() || "Project" : "Project";
    const clientName =
      typeof p.clientName === "string" ? p.clientName.trim() || "Your client" : "Your client";

    const sent = await sendFreelancerDashboardEmail({
      to: freelancer.email,
      headline: "Client opened the portal",
      actorName: clientName,
      actorRoleLine: "Client",
      actorAvatarUrl: p.clientAvatarUrl ?? null,
      bodyLines: [
        `${clientName} opened the project portal for the first time.`,
        "They can now see updates, messages, and shared files for this project.",
      ],
      ctaPath: `/project/${p.projectId}/dashboard`,
      ctaLabel: "Open project",
      projectName,
    });
    if (!sent.ok) return;
  } catch (e) {
    console.error("[notifications] notifyFreelancerClientOpenedPortal:", e);
  }
}

/**
 * Admin/cron path (no session): uses prefs loaded with the service role.
 *
 * @param {{
 *   to: string;
 *   projectId: string;
 *   projectName: string;
 *   invoiceId: string;
 *   amountLabel: string;
 *   dueDateLabel: string;
 *   notificationPreferences: unknown;
 * }} p
 */
export async function notifyFreelancerInvoiceOverdueForCron(p) {
  try {
    if (!hasResend()) {
      if (process.env.NODE_ENV === "development") {
        console.info("[notifications] Resend not configured — skipping overdue invoice email.");
      }
      return { ok: false, error: "Resend not configured" };
    }

    const prefs = mergeAllNotificationPreferences(p.notificationPreferences);
    if (prefs.invoiceOverdue === false) {
      return { ok: true, skipped: true };
    }

    const inv = invoiceNoLabel(p.invoiceId);
    const projectName =
      typeof p.projectName === "string" ? p.projectName.trim() || "Project" : "Project";

    const sent = await sendFreelancerDashboardEmail({
      to: p.to,
      headline: "Invoice overdue",
      actorName: "Mably",
      actorRoleLine: "Billing reminder",
      actorAvatarUrl: null,
      bodyLines: [
        `${inv} for ${projectName} (${p.amountLabel}) was due on ${p.dueDateLabel}.`,
        "Open Payments to update the invoice or follow up with your client.",
      ],
      ctaPath: `/project/${p.projectId}/payments`,
      ctaLabel: "View payments",
      projectName,
    });
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
    return { ok: true };
  } catch (e) {
    console.error("[notifications] notifyFreelancerInvoiceOverdueForCron:", e);
    return { ok: false, error: String(e) };
  }
}
