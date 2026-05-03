import { NextResponse } from "next/server";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { getPolarWebhookSecret } from "@/lib/billing/polar-env";
import { processPolarWebhookEvent } from "@/lib/billing/handle-polar-webhook";

export const runtime = "nodejs";

/**
 * Polar webhook endpoint. Configure in Polar dashboard:
 * `https://<your-domain>/api/webhooks/polar`
 * Use the endpoint signing secret as POLAR_WEBHOOK_SECRET.
 */
export async function POST(request) {
  const secret = getPolarWebhookSecret();
  if (!secret) {
    console.error("[polar] POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const deliveryId =
    request.headers.get("webhook-id") ?? request.headers.get("Webhook-Id") ?? null;

  const headersObj = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  try {
    const wh = new Webhook(secret);
    const event = wh.verify(rawBody, headersObj);
    const result = await processPolarWebhookEvent(event, deliveryId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Handler error" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    console.error("[polar] webhook:", e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
