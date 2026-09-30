/** Format an ISO date/time → "August 19, 2026" */
export function formatBlogDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Allow links and images to point only at the web, email, or paths on this site.
 * Returns null for anything else (e.g. `javascript:` URLs).
 */
export function safeBlogUrl(url) {
  const value = typeof url === "string" ? url.trim() : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  return /^(https?:\/\/|mailto:)/i.test(value) ? value : null;
}
