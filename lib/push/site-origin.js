/**
 * Base URL for links/icons inside push payloads.
 * Prefer the browser origin the user is on (passed from client in dev).
 */
export function resolvePushSiteOrigin(preferredOrigin) {
  const fromClient =
    typeof preferredOrigin === "string" ? preferredOrigin.trim().replace(/\/$/, "") : "";
  if (fromClient) return fromClient;

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}
