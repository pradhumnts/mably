import {
  Calendar,
  CreditCard,
  FolderPlus,
  MessageCircle,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

/** @typedef {'unread_chat' | 'file_revision' | 'invoice_overdue' | 'portal_not_opened' | 'due_soon' | 'client_opened_portal' | 'payment_received' | 'project_created' | 'activity_comment' | 'activity_file_upload' | 'activity_invoice_sent' | 'activity_approval'} NotificationType */

export const FREELANCER_NOTIFICATION_META = {
  unread_chat: {
    Icon: MessageCircle,
    label: "Chat",
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    iconTone: "bg-sky-500 text-white",
  },
  file_revision: {
    Icon: Upload,
    label: "Files",
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    iconTone: "bg-violet-600 text-white",
  },
  invoice_overdue: {
    Icon: CreditCard,
    label: "Payment",
    tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    iconTone: "bg-rose-600 text-white",
  },
  portal_not_opened: {
    Icon: UserRound,
    label: "Invite",
    tone: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
    iconTone: "bg-amber-500 text-white",
  },
  due_soon: {
    Icon: Calendar,
    label: "Deadline",
    tone: "bg-orange-500/10 text-orange-800 dark:text-orange-200",
    iconTone: "bg-orange-500 text-white",
  },
  client_opened_portal: {
    Icon: Sparkles,
    label: "Portal",
    tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    iconTone: "bg-emerald-600 text-white",
  },
  payment_received: {
    Icon: CreditCard,
    label: "Payment",
    tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    iconTone: "bg-emerald-600 text-white",
  },
  project_created: {
    Icon: FolderPlus,
    label: "Project",
    tone: "bg-primary/10 text-primary",
    iconTone: "bg-primary text-primary-foreground",
  },
  activity_comment: {
    Icon: MessageCircle,
    label: "Comment",
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    iconTone: "bg-violet-600 text-white",
  },
  activity_file_upload: {
    Icon: Upload,
    label: "Files",
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    iconTone: "bg-violet-600 text-white",
  },
  activity_invoice_sent: {
    Icon: CreditCard,
    label: "Invoice",
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    iconTone: "bg-sky-600 text-white",
  },
  activity_approval: {
    Icon: Upload,
    label: "Approval",
    tone: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
    iconTone: "bg-amber-500 text-white",
  },
};

/**
 * @param {string} type
 * @param {import("@/lib/notifications/notification-preference-defaults").typeof NOTIFICATION_PREFERENCE_DEFAULTS} prefs
 */
export function isNotificationAllowedByPreferences(type, prefs) {
  const activity = prefs.activityNotifications ?? {};
  switch (type) {
    case "unread_chat":
      return prefs.newMessages === true;
    case "file_revision":
      return prefs.fileUploads === true || activity.fileApprovals === true;
    case "invoice_overdue":
      return prefs.invoiceOverdue === true || prefs.paymentReminders === true;
    case "portal_not_opened":
      // Shares Settings toggle "Client opened portal" (portal lifecycle alerts).
      return prefs.clientOpenedPortal === true;
    case "due_soon":
      return prefs.milestoneDeadlines === true;
    case "client_opened_portal":
      return prefs.clientOpenedPortal === true;
    case "payment_received":
      return prefs.paymentReceived === true;
    case "project_created":
      return prefs.projectCreated === true;
    case "activity_comment":
      return activity.comments === true;
    case "activity_file_upload":
      return prefs.fileUploads === true;
    case "activity_invoice_sent":
      return activity.invoiceSent === true;
    case "activity_approval":
      return activity.fileApprovals === true;
    default:
      return true;
  }
}
