import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";

/** @typedef {"files" | "comments" | "approvals" | "payments" | "general"} ActivityCategory */

function invoiceDisplayId(id) {
  const compact = String(id).replace(/-/g, "");
  return `#${compact.slice(0, 8).toUpperCase()}`;
}

function formatUsd(amount) {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatRelativeActivityTime(iso) {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const dayMs = 86400000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfToday.getTime() - startOfThatDay.getTime()) / dayMs);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  if (days >= 7 && days < 14) return "1 week ago";
  if (days >= 14 && days < 21) return "2 weeks ago";
  if (days >= 21 && days < 30) return "3 weeks ago";
  if (days >= 30 && days < 60) return "1 month ago";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function truncateBody(text, max = 600) {
  const t = typeof text === "string" ? text.trim() : "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** @param {string} projectId @param {string} [fileId] */
function activityLibraryFilesHref(projectId, fileId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return null;
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (fid) {
    return `/project/${pid}/library/files?discussion=${encodeURIComponent(fid)}`;
  }
  return `/project/${pid}/library/files`;
}

/** @param {string} projectId @param {string} [linkId] */
function activityLibraryLinksHref(projectId, linkId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return null;
  const lid = typeof linkId === "string" ? linkId.trim() : "";
  if (lid) {
    return `/project/${pid}/library/links?link=${encodeURIComponent(lid)}`;
  }
  return `/project/${pid}/library/links`;
}

/** @param {string} projectId */
function activityPaymentsHref(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return null;
  return `/project/${pid}/payments`;
}

/** @param {unknown} raw */
function safeExternalHref(raw) {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return null;
  if (t.startsWith("https://") || t.startsWith("http://")) return t;
  return null;
}

/**
 * @param {unknown} row
 * @param {string} [projectId]
 */
export function mapActivityEventRowToTimelineItem(row, projectId = "") {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const id = row?.id != null ? String(row.id) : "";
  const eventType = typeof row?.event_type === "string" ? row.event_type : "";
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const createdAt = typeof row?.created_at === "string" ? row.created_at : "";

  const user = {
    name: typeof row?.actor_display_name === "string" ? row.actor_display_name : "Member",
    avatar: typeof row?.actor_avatar_url === "string" ? row.actor_avatar_url : "",
  };

  /** @type {ActivityCategory} */
  let category = "general";

  const base = {
    id,
    eventType,
    category,
    user,
    action: "",
    timestamp: formatRelativeActivityTime(createdAt),
    destinationHref: null,
    destinationLabel: null,
    externalHref: null,
    externalLabel: null,
  };

  switch (eventType) {
    case PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_UPLOADED: {
      const displayName =
        typeof payload.display_name === "string" ? payload.display_name.trim() : "File";
      const needsApproval = Boolean(payload.needs_approval);
      const fileId = payload.file_id != null ? String(payload.file_id).trim() : "";
      return {
        ...base,
        category: "files",
        action: "Uploaded",
        fileLink: displayName,
        fileMetadata: { needsApproval },
        destinationHref: activityLibraryFilesHref(pid, fileId),
        destinationLabel: "Open in library",
      };
    }
    case PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_COMMENT: {
      const fileName =
        typeof payload.file_display_name === "string" ? payload.file_display_name.trim() : "File";
      const body = typeof payload.body === "string" ? payload.body : "";
      const fileId = payload.file_id != null ? String(payload.file_id).trim() : "";
      const commentId =
        payload.comment_id != null ? String(payload.comment_id).trim() : "";
      const voiceMs = payload.voice_note_duration_ms;
      const hasVoice = voiceMs != null && Number.isFinite(Number(voiceMs)) && Number(voiceMs) > 0;
      const seconds = hasVoice ? Math.round(Number(voiceMs) / 1000) : 0;
      const mm = Math.floor(seconds / 60);
      const ss = seconds % 60;
      const durLabel = hasVoice ? `${mm}:${String(ss).padStart(2, "0")}` : "";
      const caption =
        body.trim() && body.trim() !== "[Voice note]" ? truncateBody(body) : "";
      const waveform = Array.isArray(payload.voice_note_waveform)
        ? payload.voice_note_waveform.map((n) => Math.max(0, Math.min(1, Number(n) || 0)))
        : null;
      const canPlayVoice = Boolean(hasVoice && commentId && fileId && pid);

      return {
        ...base,
        category: "comments",
        action: hasVoice ? "Left a voice note on" : "Commented on",
        fileLink: fileName,
        voiceNote: canPlayVoice
          ? {
              projectId: pid,
              fileId,
              commentId,
              durationMs: Math.round(Number(voiceMs)),
              waveform,
              caption: caption || null,
            }
          : null,
        comment: canPlayVoice
          ? undefined
          : hasVoice
            ? `Voice note (${durLabel})${caption ? ` — ${caption}` : ""}`
            : truncateBody(body) || undefined,
        destinationHref: activityLibraryFilesHref(pid, fileId),
        destinationLabel: fileId ? "Open thread in library" : "Open library",
      };
    }
    case PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_APPROVAL_CHANGED: {
      const fileName =
        typeof payload.file_display_name === "string" ? payload.file_display_name.trim() : "File";
      const status = typeof payload.approval_status === "string" ? payload.approval_status : "";
      const fileId = payload.file_id != null ? String(payload.file_id).trim() : "";
      const dest = activityLibraryFilesHref(pid, fileId);
      const label = "Open in library";
      if (status === "approved") {
        return {
          ...base,
          category: "approvals",
          action: "Approved",
          fileLink: fileName,
          badge: { type: "Approved", icon: "✓", text: "Approved" },
          destinationHref: dest,
          destinationLabel: label,
        };
      }
      if (status === "revision_requested") {
        return {
          ...base,
          category: "approvals",
          action: "Requested changes on",
          fileLink: fileName,
          badge: { type: "Needs Change", icon: "💬", text: "Needs change" },
          destinationHref: dest,
          destinationLabel: label,
        };
      }
      if (status === "pending") {
        return {
          ...base,
          category: "approvals",
          action: "Moved back to review:",
          fileLink: fileName,
          badge: { type: "Uploaded", icon: "⏳", text: "Pending review" },
          destinationHref: dest,
          destinationLabel: label,
        };
      }
      return {
        ...base,
        category: "approvals",
        action: "Updated approval for",
        fileLink: fileName,
        destinationHref: dest,
        destinationLabel: label,
      };
    }
    case PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_LINK_CREATED: {
      const title = typeof payload.title === "string" ? payload.title.trim() : "Link";
      const linkId = payload.link_id != null ? String(payload.link_id).trim() : "";
      const ext = safeExternalHref(payload.url);
      return {
        ...base,
        category: "files",
        action: "Added a library link:",
        fileLink: title,
        destinationHref: activityLibraryLinksHref(pid, linkId),
        destinationLabel: "View in links",
        externalHref: ext,
        externalLabel: ext ? "Open shared link" : null,
      };
    }
    case PROJECT_ACTIVITY_EVENT_TYPES.INVOICE_CREATED: {
      const invoiceId = payload.invoice_id != null ? String(payload.invoice_id) : "";
      const amount = payload.amount;
      const ext = safeExternalHref(payload.invoice_link);
      return {
        ...base,
        category: "payments",
        action: "Sent an invoice",
        badge: { type: "Payment", icon: "💰", text: "Invoice sent" },
        paymentDetails: {
          amount: formatUsd(amount),
          invoiceNumber: invoiceId ? invoiceDisplayId(invoiceId) : "—",
        },
        destinationHref: activityPaymentsHref(pid),
        destinationLabel: "Open payments",
        externalHref: ext,
        externalLabel: ext ? "Open invoice link" : null,
      };
    }
    default:
      return {
        ...base,
        action: "Recorded an update",
        comment:
          typeof payload.summary === "string" && payload.summary.trim()
            ? truncateBody(payload.summary)
            : undefined,
      };
  }
}
