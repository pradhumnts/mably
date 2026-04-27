import { defaultMablyEmailLogoUrl } from "@/lib/email/send-portal-invite-resend";
import {
  absoluteUrlForPath,
  buildPortalTransactionalEmailHtml,
} from "@/lib/email/portal-transactional-email-html";
import { sendPortalTransactionalEmail } from "@/lib/email/send-portal-transactional-resend";
import { fetchProjectNotificationTargets } from "@/lib/notifications/project-notification-targets";

/**
 * @typedef {{
 *   kind:
 *     | "file_uploaded"
 *     | "link_added"
 *     | "file_comment"
 *     | "file_approval_changed"
 *     | "invoice_created"
 *     | "invoice_marked_paid"
 *     | "invoice_status_client"
 *     | "chat_message";
 *   actorUserId: string;
 *   actorName: string;
 *   actorAvatarUrl: string | null;
 *   actorRoleLine: string;
 *   projectName: string;
 *   headline: string;
 *   bodyLines: string[];
 *   ctaPath: string;
 *   ctaLabel: string;
 *   recipientsFilter?: "all" | "clients_only" | "freelancers_only";
 *   skipActor?: boolean;
 * }} PortalNotifyPayload
 */

/**
 * @param {import("@/lib/notifications/project-notification-targets").ProjectNotificationTarget} target
 * @param {PortalNotifyPayload} payload
 */
function passesRoleFilter(target, filter) {
  if (!filter || filter === "all") return true;
  if (filter === "clients_only") return target.roleLine === "Client";
  if (filter === "freelancers_only") return target.roleLine === "Freelancer";
  return true;
}

function wantsEmail(target, payload) {
  if (!passesRoleFilter(target, payload.recipientsFilter ?? "all")) return false;
  const p = target.prefs;
  switch (payload.kind) {
    case "file_uploaded":
    case "link_added":
      return p.fileUploads !== false;
    case "file_comment":
      return p.activityNotifications?.comments !== false;
    case "file_approval_changed":
      return p.activityNotifications?.fileApprovals !== false;
    case "invoice_created":
      return p.activityNotifications?.invoiceSent !== false;
    case "invoice_marked_paid":
      return p.paymentReceived !== false;
    case "invoice_status_client":
      return p.activityNotifications?.invoiceSent !== false;
    case "chat_message":
      return p.newMessages !== false;
    default:
      return true;
  }
}

/**
 * Fire-and-forget portal emails: respects each recipient's `notification_preferences`.
 * Skips the acting user. No-ops when Resend or service role is not configured.
 *
 * @param {string} projectId
 * @param {PortalNotifyPayload} payload
 */
export async function sendPortalEmailNotifications(projectId, payload) {
  try {
    const pid = typeof projectId === "string" ? projectId.trim() : "";
    if (!pid) return;

    const hasResend = Boolean(
      process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim()
    );
    if (!hasResend) {
      if (process.env.NODE_ENV === "development") {
        console.info("[notifications] Resend not configured — skipping portal email.");
      }
      return;
    }

    const targets = await fetchProjectNotificationTargets(pid);
    if (!targets.length && process.env.NODE_ENV === "development") {
      console.warn(
        "[notifications] No recipients for project",
        pid,
        "— check migration get_portal_notification_recipients and profile emails."
      );
    }
    const logoUrl = defaultMablyEmailLogoUrl();
    const ctaUrl = absoluteUrlForPath(payload.ctaPath);
    const subject = `${payload.headline} — ${payload.projectName || "Project"}`;

    const html = buildPortalTransactionalEmailHtml({
      logoUrl,
      headline: payload.headline,
      actorName: payload.actorName,
      actorRoleLine: payload.actorRoleLine,
      actorAvatarUrl: payload.actorAvatarUrl,
      bodyParagraphs: payload.bodyLines,
      ctaLabel: payload.ctaLabel,
      ctaUrl,
      footerNote: `You’re receiving this because you’re on the project “${payload.projectName}” in Mably.`,
    });

    const skipActor = payload.skipActor !== false;

    for (const t of targets) {
      if (skipActor && t.userId && t.userId === payload.actorUserId) continue;
      if (!t.email) continue;
      if (!wantsEmail(t, payload)) continue;

      const r = await sendPortalTransactionalEmail({
        to: t.email,
        subject,
        html,
      });
      if (!r.ok) {
        console.error("[notifications] send failed:", t.email, r.error);
      }
    }
  } catch (e) {
    console.error("[notifications] sendPortalEmailNotifications:", e);
  }
}
