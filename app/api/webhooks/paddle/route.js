import { NextResponse } from "next/server";
import { getPaddleWebhookSecret } from "@/lib/billing/paddle-env";
import { verifyPaddleWebhookSignature } from "@/lib/billing/paddle-webhook-verify";
import { processPaddleWebhookEvent } from "@/lib/billing/handle-paddle-webhook";

export const runtime = "nodejs";

/**
 * Paddle Billing notification destination (webhook).
 * Set URL in Paddle: `https://<your-domain>/api/webhooks/paddle`
 * Use the **destination secret** as PADDLE_WEBHOOK_SECRET.
 */
export async function POST(request) {
  const secret = getPaddleWebhookSecret();
  if (!secret) {
    console.error("[paddle] PADDLE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature") ?? request.headers.get("Paddle-Signature");

  if (!verifyPaddleWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let envelope;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await processPaddleWebhookEvent(envelope);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
