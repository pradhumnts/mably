/** Defaults for `profiles.notification_preferences` (portal + dashboard toggles). */

export const NOTIFICATION_PREFERENCE_DEFAULTS = {
  fileUploads: true,
  newMessages: true,
  paymentReminders: true,
  milestoneDeadlines: true,
  activityNotifications: {
    fileApprovals: true,
    comments: true,
    milestoneStarted: true,
    milestoneCompleted: true,
    invoiceSent: false,
  },
  clientOpenedPortal: true,
  projectCreated: true,
  paymentReceived: true,
  invoiceOverdue: true,
};

/**
 * @param {unknown} raw
 */
export function mergeAllNotificationPreferences(raw) {
  const base = structuredClone(NOTIFICATION_PREFERENCE_DEFAULTS);
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const r = /** @type {Record<string, unknown>} */ (raw);
  return {
    ...base,
    ...r,
    activityNotifications: {
      ...base.activityNotifications,
      ...(typeof r.activityNotifications === "object" && r.activityNotifications
        ? r.activityNotifications
        : {}),
    },
  };
}
