import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify Paddle Billing webhook signature (Paddle-Signature header).
 * @param {string} rawBody - exact request body string (no JSON.parse before this)
 * @param {string | null} signatureHeader - Paddle-Signature header value
 * @param {string} secret - notification destination secret key
 * @param {{ maxAgeSec?: number }} [opts]
 */
export function verifyPaddleWebhookSignature(rawBody, signatureHeader, secret, opts = {}) {
  if (!secret || !signatureHeader || typeof rawBody !== "string") {
    return false;
  }

  const parts = signatureHeader.split(";").map((s) => s.trim());
  let ts = "";
  let h1 = "";
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const val = part.slice(eq + 1);
    if (key === "ts") ts = val;
    if (key === "h1") h1 = val;
  }

  if (!ts || !h1) return false;

  const maxAge = opts.maxAgeSec ?? 3600;
  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > maxAge) return false;

  const payload = `${ts}:${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(h1, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
