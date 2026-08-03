import posthog from "posthog-js";

/**
 * Thin PostHog client helpers. Safe no-ops when PostHog isn't loaded / blocked.
 */

function clientReady() {
  return typeof window !== "undefined" && Boolean(posthog?.__loaded);
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>} [properties]
 */
export function identifyUser(userId, properties = {}) {
  if (!clientReady() || !userId) return;
  try {
    const props = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value === undefined) continue;
      props[key] = value;
    }
    posthog.identify(String(userId), props);
  } catch {
    /* analytics must never break the app */
  }
}

/**
 * Clear identity on logout so the next visitor isn't merged into the prior user.
 */
export function resetAnalytics() {
  if (!clientReady()) return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 */
export function trackEvent(event, properties = {}) {
  if (!clientReady() || !event) return;
  try {
    const props = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value === undefined) continue;
      props[key] = value;
    }
    posthog.capture(String(event), props);
  } catch {
    /* ignore */
  }
}

/**
 * Update person properties without changing distinct id.
 * @param {Record<string, unknown>} properties
 */
export function setPersonProperties(properties) {
  if (!clientReady() || !properties || typeof properties !== "object") return;
  try {
    posthog.setPersonProperties(properties);
  } catch {
    /* ignore */
  }
}
