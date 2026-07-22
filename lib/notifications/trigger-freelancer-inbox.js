import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { materializeFreelancerInboxNotification } from "@/lib/notifications/materialize-freelancer-inbox";

const CHAT_PRIORITY = 1;
const FILE_REVISION_PRIORITY = 2;
const INVOICE_OVERDUE_PRIORITY = 3;
const PAYMENT_RECEIVED_PRIORITY = 10;
const PORTAL_OPENED_PRIORITY = 11;
const PROJECT_CREATED_PRIORITY = 12;

/**
 * Client (or non-freelancer) sent a chat message — inbox row for the freelancer.
 * @param {{
 *   projectId: string;
 *   freelancerId: string;
 *   messageId: string;
 *   actorUserId: string;
 *   actorName: string;
 *   actorAvatarUrl?: string | null;
 *   preview: string;
 *   createdAt?: string;
 *   projectName?: string;
 * }} p
 */
export function enqueueFreelancerInboxChatMessage(p) {
  const freelancerId = String(p.freelancerId || "").trim();
  const actorUserId = String(p.actorUserId || "").trim();
  if (!freelancerId || !actorUserId || actorUserId === freelancerId) return;

  const projectId = String(p.projectId || "").trim();
  const messageId = String(p.messageId || "").trim();
  if (!projectId || !messageId) return;

  const preview = String(p.preview || "").trim();
  const projectName = (p.projectName || "Project").trim() || "Project";

  void materializeFreelancerInboxNotification({
    userId: freelancerId,
    type: "unread_chat",
    projectId,
    sourceId: messageId,
    title: "New message",
    body: preview
      ? preview.length > 120
        ? `${preview.slice(0, 119)}…`
        : preview
      : "New message in project chat",
    href: `/project/${projectId}/dashboard?openChat=1`,
    createdAt: p.createdAt,
    priority: CHAT_PRIORITY,
    actorName: p.actorName || "Client",
    actorAvatar: p.actorAvatarUrl ?? null,
    projectName,
  });
}

/**
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   projectName?: string;
 *   openedAt: string;
 *   clientName: string;
 *   clientAvatarUrl?: string | null;
 * }} p
 */
export function enqueueFreelancerInboxClientOpenedPortal(p) {
  void materializeFreelancerInboxNotification({
    userId: p.freelancerId,
    type: "client_opened_portal",
    projectId: p.projectId,
    sourceId: p.openedAt,
    title: "Client opened the portal",
    body: `${p.clientName} visited ${p.projectName || "the project"} for the first time`,
    href: `/project/${p.projectId}/dashboard`,
    createdAt: p.openedAt,
    priority: PORTAL_OPENED_PRIORITY,
    actorName: p.clientName,
    actorAvatar: p.clientAvatarUrl ?? null,
    projectName: p.projectName,
  });
}

/**
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   projectName: string;
 *   createdAt?: string;
 * }} p
 */
export function enqueueFreelancerInboxProjectCreated(p) {
  void materializeFreelancerInboxNotification({
    userId: p.freelancerId,
    type: "project_created",
    projectId: p.projectId,
    sourceId: p.createdAt || new Date().toISOString(),
    title: "New project created",
    body: `You set up ${p.projectName || "a new project"}`,
    href: `/project/${p.projectId}/dashboard`,
    createdAt: p.createdAt,
    priority: PROJECT_CREATED_PRIORITY,
    projectName: p.projectName,
  });
}

/**
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   fileId: string;
 *   fileName: string;
 *   actorName: string;
 *   actorAvatarUrl?: string | null;
 *   projectName?: string;
 *   updatedAt?: string;
 * }} p
 */
export function enqueueFreelancerInboxFileRevision(p) {
  const fileName = (p.fileName || "File").trim();
  void materializeFreelancerInboxNotification({
    userId: p.freelancerId,
    type: "file_revision",
    projectId: p.projectId,
    sourceId: p.fileId,
    title: `Revision requested · ${fileName}`,
    body: `Your client asked for changes on ${fileName}`,
    href: `/project/${p.projectId}/library/files?discussion=${p.fileId}`,
    createdAt: p.updatedAt,
    priority: FILE_REVISION_PRIORITY,
    actorName: p.actorName,
    actorAvatar: p.actorAvatarUrl ?? null,
    projectName: p.projectName,
  });
}

/**
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   invoiceId: string;
 *   projectName?: string;
 *   amountLabel?: string;
 *   dueDateLabel?: string;
 *   notificationPreferences?: unknown;
 * }} p
 */
export function enqueueFreelancerInboxInvoiceOverdue(p) {
  const dueLabel = p.dueDateLabel ? ` · due ${p.dueDateLabel}` : "";
  void materializeFreelancerInboxNotification({
    userId: p.freelancerId,
    type: "invoice_overdue",
    projectId: p.projectId,
    sourceId: p.invoiceId,
    title: `Invoice overdue${dueLabel}`,
    body: `Follow up on payment for ${p.projectName || "this project"}`,
    href: `/project/${p.projectId}/payments`,
    priority: INVOICE_OVERDUE_PRIORITY,
    projectName: p.projectName,
    notificationPreferences: p.notificationPreferences,
  });
}

/**
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   invoiceId: string;
 *   amountLabel: string;
 *   projectName?: string;
 *   updatedAt?: string;
 * }} p
 */
export function enqueueFreelancerInboxPaymentReceived(p) {
  void materializeFreelancerInboxNotification({
    userId: p.freelancerId,
    type: "payment_received",
    projectId: p.projectId,
    sourceId: p.invoiceId,
    title: `Payment received · ${p.amountLabel}`,
    body: `Invoice marked paid for ${p.projectName || "this project"}`,
    href: `/project/${p.projectId}/payments`,
    createdAt: p.updatedAt,
    priority: PAYMENT_RECEIVED_PRIORITY,
    projectName: p.projectName,
  });
}

/**
 * Map activity event types to inbox materialization.
 * @param {{
 *   freelancerId: string;
 *   projectId: string;
 *   eventId: string;
 *   eventType: string;
 *   createdAt: string;
 *   actorId?: string;
 *   actorName: string;
 *   actorAvatarUrl?: string | null;
 *   payload?: Record<string, unknown>;
 *   projectName?: string;
 * }} p
 */
export function enqueueFreelancerInboxFromActivity(p) {
  const pl = p.payload && typeof p.payload === "object" ? p.payload : {};
  const fileName = String(pl.file_display_name || pl.display_name || "a file").trim();
  const fileId = pl.file_id ? String(pl.file_id) : "";
  const discussionHref = fileId
    ? `/project/${p.projectId}/library/files?discussion=${fileId}`
    : `/project/${p.projectId}/library/files`;

  const base = {
    userId: p.freelancerId,
    projectId: p.projectId,
    sourceId: p.eventId,
    createdAt: p.createdAt,
    actorName: p.actorName,
    actorAvatar: p.actorAvatarUrl ?? null,
    projectName: p.projectName,
  };

  if (p.eventType === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_COMMENT) {
    void materializeFreelancerInboxNotification({
      ...base,
      type: "activity_comment",
      priority: 7,
      title: `New comment on ${fileName}`,
      body: String(pl.body || "").trim().slice(0, 120) || `Activity on ${fileName}`,
      href: discussionHref,
    });
    return;
  }

  if (p.eventType === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_UPLOADED) {
    void materializeFreelancerInboxNotification({
      ...base,
      type: "activity_file_upload",
      priority: 8,
      title: `File uploaded · ${fileName}`,
      body: `${p.actorName || "Someone"} uploaded ${fileName}`,
      href: discussionHref,
    });
    return;
  }

  if (p.eventType === PROJECT_ACTIVITY_EVENT_TYPES.INVOICE_CREATED) {
    const amt = pl.amount ? String(pl.amount) : "";
    void materializeFreelancerInboxNotification({
      ...base,
      type: "activity_invoice_sent",
      priority: 9,
      title: amt ? `Invoice sent · ${amt}` : "Invoice sent",
      body: `New invoice for ${p.projectName || "this project"}`,
      href: `/project/${p.projectId}/payments`,
    });
    return;
  }

  if (p.eventType === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_APPROVAL_CHANGED) {
    if (String(pl.approval_status || "") !== "revision_requested") return;
    void materializeFreelancerInboxNotification({
      ...base,
      type: "activity_approval",
      priority: 6,
      title: `Approval update · ${fileName}`,
      body: `Revision requested on ${fileName}`,
      href: discussionHref,
    });
    return;
  }

  if (p.eventType === PROJECT_ACTIVITY_EVENT_TYPES.ACTION_COMPLETED) {
    const actorId = String(p.actorId || "").trim();
    if (actorId && actorId === String(p.freelancerId || "").trim()) return;

    const actionTitle =
      typeof pl.title === "string" && pl.title.trim() ? pl.title.trim() : "an action";
    void materializeFreelancerInboxNotification({
      ...base,
      type: "activity_action_completed",
      priority: 8,
      title: `Action completed · ${actionTitle}`,
      body: `${p.actorName || "Someone"} completed ${actionTitle}`,
      href: `/project/${p.projectId}/actions`,
    });
  }
}
