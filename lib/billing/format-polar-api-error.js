/**
 * Turn Polar / FastAPI-style error payloads into a user-visible string.
 * @param {unknown} value
 * @returns {string | null}
 */
export function formatPolarApiError(value) {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    const parts = value.map((item) => formatPolarApiError(item)).filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
  }

  if (typeof value === "object") {
    const o = /** @type {Record<string, unknown>} */ (value);
    return (
      formatPolarApiError(o.msg) ??
      formatPolarApiError(o.message) ??
      formatPolarApiError(o.detail) ??
      formatPolarApiError(o.error) ??
      null
    );
  }

  return null;
}

/**
 * @param {unknown} payload — parsed JSON body from our API or Polar
 * @param {string} [fallback]
 */
export function checkoutErrorMessageFromPayload(payload, fallback = "Checkout failed") {
  if (!payload || typeof payload !== "object") return fallback;
  const p = /** @type {Record<string, unknown>} */ (payload);
  return (
    formatPolarApiError(p.detail) ??
    formatPolarApiError(p.message) ??
    formatPolarApiError(p.error) ??
    fallback
  );
}
