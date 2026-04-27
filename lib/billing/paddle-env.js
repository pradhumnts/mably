/**
 * Paddle Billing env (never log secrets).
 * Sandbox client tokens typically start with `test_`, live with `live_`.
 */

export function getPaddleEnvironment() {
  const raw = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "production" || raw === "sandbox") return raw;
  return "sandbox";
}

export function getPaddleClientToken() {
  return process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() ?? "";
}

export function getPaddlePriceStarter() {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER?.trim() ?? "";
}

export function getPaddlePriceGrowth() {
  return process.env.NEXT_PUBLIC_PADDLE_PRICE_GROWTH?.trim() ?? "";
}

export function getPaddleApiKey() {
  return process.env.PADDLE_API_KEY?.trim() ?? "";
}

export function getPaddleWebhookSecret() {
  return process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? "";
}

/** Map Paddle price id → plan key for app logic */
export function priceIdToPlanKey(priceId) {
  if (!priceId) return null;
  if (priceId === getPaddlePriceStarter()) return "starter";
  if (priceId === getPaddlePriceGrowth()) return "growth";
  return null;
}
