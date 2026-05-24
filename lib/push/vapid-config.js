/**
 * VAPID keys for Web Push. Generate with: node scripts/generate-vapid-keys.mjs
 *
 * Env:
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (e.g. mailto:hello@mably.io)
 */

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export function getVapidConfig() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "mailto:hello@mably.io";

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured() {
  return Boolean(getVapidConfig());
}
