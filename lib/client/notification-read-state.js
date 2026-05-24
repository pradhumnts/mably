/** @deprecated Server-synced; kept for one-time migration from localStorage. */
const LEGACY_STORAGE_KEY = "mably-notifications-read-v1";

export const NOTIFICATIONS_READ_CHANGED_EVENT = "mably-notifications-read";

/**
 * Legacy browser-only read ids (pre server sync).
 * @returns {Set<string>}
 */
export function getLegacyLocalReadNotificationIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string" && id.trim()));
  } catch {
    return new Set();
  }
}

export function clearLegacyLocalReadNotificationIds() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Notify other UI (e.g. sidebar badge) that read state changed in this tab.
 * @param {Set<string>} [readIds]
 */
export function emitNotificationsReadChanged(readIds) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_READ_CHANGED_EVENT, {
      detail: readIds ? [...readIds] : undefined,
    })
  );
}

/** @deprecated Use getLegacyLocalReadNotificationIds */
export function getReadNotificationIds() {
  return getLegacyLocalReadNotificationIds();
}
