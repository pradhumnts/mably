import * as Sentry from "@sentry/nextjs";

/**
 * Browser "Failed to fetch" noise that isn't actionable app bugs:
 * - PostHog blocked by ad blockers / extensions
 * - Next.js Server Action POSTs aborted by navigation, sleep, or brief offline
 */
function isBenignFetchFailure(reason) {
  const message =
    typeof reason === "string"
      ? reason
      : reason?.message != null
        ? String(reason.message)
        : "";
  if (!message) return false;
  if (/posthog\.com/i.test(message) || /Failed to fetch.*posthog/i.test(message)) {
    return true;
  }

  const looksLikeNetworkFetch =
    /^Failed to fetch$/i.test(message.trim()) ||
    /NetworkError when attempting to fetch resource/i.test(message) ||
    /^Load failed$/i.test(message.trim());
  if (!looksLikeNetworkFetch) return false;

  const stack = typeof reason?.stack === "string" ? reason.stack : "";
  return /fetchServerAction|server-action-reducer/i.test(stack);
}

function eventLooksLikeBenignServerActionFetch(event) {
  const values = event?.exception?.values;
  if (!Array.isArray(values) || values.length === 0) return false;

  const top = values[0];
  const message = String(top?.value ?? event?.message ?? "");
  const looksLikeNetworkFetch =
    /^Failed to fetch$/i.test(message.trim()) ||
    /NetworkError when attempting to fetch resource/i.test(message) ||
    /^Load failed$/i.test(message.trim());
  if (!looksLikeNetworkFetch) return false;

  const frames = top?.stacktrace?.frames;
  if (!Array.isArray(frames)) return false;
  return frames.some((frame) => {
    const fn = String(frame?.function ?? "");
    const file = String(frame?.filename ?? frame?.abs_path ?? "");
    return (
      /fetchServerAction/i.test(fn) ||
      /server-action-reducer/i.test(file) ||
      /server-action-reducer/i.test(fn)
    );
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (isBenignFetchFailure(event.reason)) {
      event.preventDefault();
    }
  });
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE || 0),
  replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE || 0.1),
  integrations: [Sentry.replayIntegration()],
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  ignoreErrors: [
    // Keep PostHog / extension fetch noise out even when stack is missing.
    /Failed to fetch.*posthog/i,
  ],
  beforeSend(event, hint) {
    if (isBenignFetchFailure(hint?.originalException)) {
      return null;
    }
    if (eventLooksLikeBenignServerActionFetch(event)) {
      return null;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
