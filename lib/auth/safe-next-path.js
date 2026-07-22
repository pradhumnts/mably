/**
 * Prevents open redirects: only same-origin relative paths under known prefixes.
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function sanitizeNextPath(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.length > 512) return null;
  const lower = s.toLowerCase();
  if (
    lower.startsWith("/javascript:") ||
    lower.startsWith("/data:") ||
    lower.includes("\\")
  ) {
    return null;
  }
  const allowedPrefixes = [
    "/project/",
    "/projects",
    "/messages",
    "/portal",
    "/clients",
    "/settings",
    "/features",
    "/demo",
    "/waitlist",
    "/onboarding",
  ];
  const allowed = allowedPrefixes.some((p) => {
    if (p.endsWith("/")) {
      return s.startsWith(p);
    }
    return s === p || s.startsWith(`${p}/`) || s.startsWith(`${p}?`);
  });
  if (!allowed) {
    return null;
  }
  return s;
}

export function normalizeEmail(email) {
  if (email == null || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * @param {string | null} path — sanitized app path
 * @returns {string | null} project UUID if path is /project/:id or /project/:id/...
 */
export function parseProjectIdFromNextPath(path) {
  if (!path || !path.startsWith("/project/")) return null;
  const rest = path.slice("/project/".length);
  const id = rest.split("/")[0]?.split("?")[0]?.trim();
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  return id;
}
