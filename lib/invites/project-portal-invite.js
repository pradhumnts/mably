import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

/**
 * Site origin for links in emails and redirects (no trailing slash).
 */
export function getSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      return "";
    }
  }
  return "";
}

/**
 * Login URL that returns the user to the project portal after OTP (Phase 1).
 * Optional `intent=portal` switches login chrome to portal-oriented copy.
 */
export function buildPortalInviteLoginUrl(projectId) {
  const origin = getSiteOrigin();
  const next = sanitizeNextPath(`/project/${projectId}`) ?? `/project/${projectId}`;
  const qs = new URLSearchParams({ next, intent: "portal" });
  const path = `/?${qs.toString()}`;
  if (!origin) return path;
  return `${origin}${path}`;
}
