import posthog from "posthog-js";

/**
 * Thin PostHog client helpers. Safe no-ops when PostHog isn't configured / blocked.
 *
 * Important: init must be synchronous on first use. Gating on `__loaded` alone
 * (while init only ran in a parent useEffect) caused identify/capture to
 * silently no-op before PostHog was ready.
 */

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || "";
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

let initAttempted = false;

/**
 * @returns {boolean} true when PostHog is configured and initialized on the client
 */
export function ensurePostHog() {
  if (typeof window === "undefined") return false;
  if (!posthogKey) return false;
  if (posthog.__loaded) return true;
  if (initAttempted) return Boolean(posthog.__loaded);

  initAttempted = true;
  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: "2025-05-24",
      // Only create person profiles when we call identify (signed-in users).
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      capture_exceptions: false,
      on_request_error: () => {
        /* ad blockers / privacy extensions often block us.i.posthog.com */
      },
    });
    return Boolean(posthog.__loaded);
  } catch {
    return false;
  }
}

export function isPostHogConfigured() {
  return Boolean(posthogKey);
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>} [properties]
 */
export function identifyUser(userId, properties = {}) {
  if (!ensurePostHog() || !userId) return;
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
  if (!ensurePostHog()) return;
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
  if (!ensurePostHog() || !event) return;
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
  if (!ensurePostHog() || !properties || typeof properties !== "object") return;
  try {
    posthog.setPersonProperties(properties);
  } catch {
    /* ignore */
  }
}

export { posthog };
