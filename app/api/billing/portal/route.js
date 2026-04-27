import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaddleApiKey } from "@/lib/billing/paddle-env";

export const runtime = "nodejs";

/** Open Paddle customer portal (manage subscription / payment method). */
export async function POST() {
  const apiKey = getPaddleApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: row } = await admin
    .from("freelancer_subscriptions")
    .select("paddle_customer_id, paddle_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row?.paddle_customer_id) {
    return NextResponse.json({ error: "No Paddle customer yet. Subscribe first." }, { status: 400 });
  }

  const body =
    row.paddle_subscription_id != null
      ? JSON.stringify({ subscription_ids: [row.paddle_subscription_id] })
      : "{}";

  const res = await fetch(`https://api.paddle.com/customers/${row.paddle_customer_id}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("[paddle] portal session:", res.status, json);
    return NextResponse.json(
      { error: json?.error?.detail ?? json?.error ?? "Portal session failed" },
      { status: res.status >= 400 ? res.status : 502 }
    );
  }

  const url = json?.data?.urls?.general?.overview ?? null;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "No portal URL returned" }, { status: 502 });
  }

  return NextResponse.json({ url });
}
