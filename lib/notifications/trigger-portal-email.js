import { createClient } from "@/lib/supabase/server";
import { sendPortalEmailNotifications } from "@/lib/notifications/portal-email-notify";

async function projectDisplayName(projectId) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
    return (data?.name ?? "").trim() || "Project";
  } catch {
    return "Project";
  }
}

function roleLineForUser(projectFreelancerId, userId) {
  return userId === projectFreelancerId ? "Freelancer" : "Client";
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 */
export async function notifyPortalLibraryFileUploaded(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  void sendPortalEmailNotifications(p.projectId, {
    kind: "file_uploaded",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline: "New file in the library",
    bodyLines: [
      `${p.actorName} uploaded “${p.displayName}”.`,
      "Open the project library to download the file or join the discussion.",
    ],
    ctaPath: `/project/${p.projectId}/library/files`,
    ctaLabel: "Open library",
    recipientsFilter: "all",
    skipActor: false,
  });
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {string} p.title
 */
export async function notifyPortalLibraryLinkAdded(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  void sendPortalEmailNotifications(p.projectId, {
    kind: "link_added",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline: "New link in the library",
    bodyLines: [
      `${p.actorName} added a link: “${p.title}”.`,
      "Open the library to visit the link.",
    ],
    ctaPath: `/project/${p.projectId}/library/links`,
    ctaLabel: "Open links",
    recipientsFilter: "all",
    skipActor: false,
  });
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {string} p.fileDisplayName
 * @param {string} p.preview
 * @param {boolean} [p.isVoice]
 * @param {string} [p.durationLabel]
 * @param {string} [p.voiceCaption]
 */
export async function notifyPortalLibraryFileComment(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  const rawPreview = typeof p.preview === "string" ? p.preview : "";
  const preview =
    rawPreview.length > 220 ? `${rawPreview.slice(0, 219).trim()}…` : rawPreview;
  const isVoice = Boolean(p.isVoice);
  const duration =
    typeof p.durationLabel === "string" && p.durationLabel.trim()
      ? p.durationLabel.trim()
      : "";
  const caption =
    typeof p.voiceCaption === "string" && p.voiceCaption.trim() ? p.voiceCaption.trim() : "";

  const headline = isVoice ? "New voice note on a file" : "New comment on a file";
  const firstLine = isVoice
    ? `${p.actorName} left a voice note on “${p.fileDisplayName}”${duration ? ` (${duration})` : ""}.`
    : `${p.actorName} commented on “${p.fileDisplayName}”.`;

  const secondLine = isVoice
    ? caption
      ? `Caption: “${caption.length > 200 ? `${caption.slice(0, 199)}…` : caption}”`
      : "Open the library to listen in the file discussion."
    : preview
      ? `“${preview}”`
      : "Open the thread to read the full message.";

  void sendPortalEmailNotifications(p.projectId, {
    kind: "file_comment",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline,
    bodyLines: [firstLine, secondLine],
    ctaPath: `/project/${p.projectId}/library/files`,
    ctaLabel: "View library",
    recipientsFilter: "all",
    skipActor: false,
  });
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {string} p.fileDisplayName
 * @param {string} p.statusLabel
 */
export async function notifyPortalLibraryFileApprovalChanged(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  void sendPortalEmailNotifications(p.projectId, {
    kind: "file_approval_changed",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline: "File approval updated",
    bodyLines: [
      `${p.actorName} updated approval for “${p.fileDisplayName}”: ${p.statusLabel}.`,
      "Review the file in the library for the latest status.",
    ],
    ctaPath: `/project/${p.projectId}/library/files`,
    ctaLabel: "Open library",
    recipientsFilter: "all",
    skipActor: false,
  });
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {string} p.amountLabel
 */
export async function notifyPortalInvoiceCreated(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  void sendPortalEmailNotifications(p.projectId, {
    kind: "invoice_created",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline: "New invoice",
    bodyLines: [
      `${p.actorName} added an invoice for ${p.amountLabel}.`,
      "Open Payments to view details and the invoice link.",
    ],
    ctaPath: `/project/${p.projectId}/payments`,
    ctaLabel: "View payments",
    recipientsFilter: "clients_only",
  });
}

function invoiceNoLabel(id) {
  const compact = String(id).replace(/-/g, "");
  return `#${compact.slice(0, 8).toUpperCase()}`;
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {'paid' | 'unpaid' | 'canceled'} p.status
 * @param {string} p.amountLabel
 * @param {string} p.invoiceId
 */
export async function notifyPortalInvoiceStatusChanged(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  const inv = invoiceNoLabel(p.invoiceId);

  if (p.status === "paid") {
    void sendPortalEmailNotifications(p.projectId, {
      kind: "invoice_marked_paid",
      actorUserId: p.actorUserId,
      actorName: p.actorName,
      actorAvatarUrl: p.actorAvatarUrl,
      actorRoleLine,
      projectName,
      headline: "Invoice marked paid",
      bodyLines: [
        `${p.actorName} marked invoice ${inv} (${p.amountLabel}) as paid.`,
        "Open Payments to see your full invoice history for this project.",
      ],
      ctaPath: `/project/${p.projectId}/payments`,
      ctaLabel: "View payments",
      recipientsFilter: "freelancers_only",
      skipActor: false,
    });
    return;
  }

  if (p.status === "canceled") {
    void sendPortalEmailNotifications(p.projectId, {
      kind: "invoice_status_client",
      actorUserId: p.actorUserId,
      actorName: p.actorName,
      actorAvatarUrl: p.actorAvatarUrl,
      actorRoleLine,
      projectName,
      headline: "Invoice canceled",
      bodyLines: [
        `${p.actorName} canceled invoice ${inv} (${p.amountLabel}).`,
        "Open Payments for current invoices and details.",
      ],
      ctaPath: `/project/${p.projectId}/payments`,
      ctaLabel: "View payments",
      recipientsFilter: "clients_only",
    });
    return;
  }

  if (p.status === "unpaid") {
    void sendPortalEmailNotifications(p.projectId, {
      kind: "invoice_status_client",
      actorUserId: p.actorUserId,
      actorName: p.actorName,
      actorAvatarUrl: p.actorAvatarUrl,
      actorRoleLine,
      projectName,
      headline: "Invoice updated",
      bodyLines: [
        `${p.actorName} moved invoice ${inv} (${p.amountLabel}) back to unpaid.`,
        "Open Payments when you’re ready to complete payment.",
      ],
      ctaPath: `/project/${p.projectId}/payments`,
      ctaLabel: "View payments",
      recipientsFilter: "clients_only",
    });
  }
}

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string | null} p.actorAvatarUrl
 * @param {string} p.preview
 */
export async function notifyPortalChatMessage(p) {
  const projectName = await projectDisplayName(p.projectId);
  const actorRoleLine = roleLineForUser(p.projectFreelancerId, p.actorUserId);
  const preview =
    p.preview.length > 220 ? `${p.preview.slice(0, 219).trim()}…` : p.preview;
  void sendPortalEmailNotifications(p.projectId, {
    kind: "chat_message",
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    actorAvatarUrl: p.actorAvatarUrl,
    actorRoleLine,
    projectName,
    headline: "New project message",
    bodyLines: [
      `${p.actorName} sent a message in project chat.`,
      preview ? `“${preview}”` : "Open the portal to read and reply.",
    ],
    ctaPath: `/project/${p.projectId}/dashboard`,
    ctaLabel: "Open project",
    recipientsFilter: "all",
  });
}
