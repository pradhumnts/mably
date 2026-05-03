import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPolarAccessToken, getPolarApiBase } from "@/lib/billing/polar-env";

export const runtime = "nodejs";

/** Open Polar customer portal (manage subscription / payment method). */
export async function POST() {
  const token = getPolarAccessToken();
  if (!token) {
    return NextResponse.json({ error: "POLAR_ACCESS_TOKEN is not set" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("freelancer_subscriptions")
    .select("polar_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[polar] portal load subscription:", error.message);
    return NextResponse.json({ error: "Could not load subscription" }, { status: 500 });
  }

  if (!row?.polar_customer_id) {
    return NextResponse.json({ error: "No Polar customer yet. Subscribe first." }, { status: 400 });
  }

  const res = await fetch(`${getPolarApiBase()}/customer-sessions/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customer_id: row.polar_customer_id }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[polar] customer session:", res.status, json);
    return NextResponse.json(
      { error: json.detail ?? json.message ?? json.error ?? "Portal session failed" },
      { status: 502 }
    );
  }

  const url = json.customer_portal_url ?? json.url;
  if (!url) {
    return NextResponse.json({ error: "No portal URL returned" }, { status: 502 });
  }

  return NextResponse.json({ url });
}
