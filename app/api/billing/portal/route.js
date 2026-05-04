import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPolarApiBase, getPolarTokenForCustomerSessions } from "@/lib/billing/polar-env";

export const runtime = "nodejs";

/** Open Polar customer portal (manage subscription / payment method). */
export async function POST() {
  const token = getPolarTokenForCustomerSessions();
  if (!token) {
    return NextResponse.json(
      { error: "POLAR_ACCESS_TOKEN or POLAR_CUSTOMER_SESSIONS_TOKEN must be set" },
      { status: 500 }
    );
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
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[polar] portal load subscription:", error.message);
    return NextResponse.json({ error: "Could not load subscription" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "No subscription in Mably yet. Subscribe or sync first." }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ?? "";
  const returnUrl = site ? `${site}/billing` : undefined;

  /** Same external id as checkout — Polar maps this to the customer. */
  const res = await fetch(`${getPolarApiBase()}/customer-sessions/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_customer_id: user.id,
      ...(returnUrl ? { return_url: returnUrl } : {}),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[polar] customer session:", res.status, json);
    const detail = String(json.detail ?? json.message ?? json.error ?? "").toLowerCase();
    const oauthError = String(json.error ?? "").toLowerCase();
    const insufficientScope =
      (res.status === 403 || res.status === 401) &&
      (detail.includes("insufficient scope") || oauthError === "insufficient_scope");
    if (insufficientScope) {
      return NextResponse.json(
        {
          code: "insufficient_scope",
          required_scope: "customer_sessions:write",
          docs_url: "https://polar.sh/docs/integrate/oat",
          error:
            "Your Polar Organization Access Token is missing the customer_sessions:write scope. In Polar: Settings → your organization → Developers → create or edit a token and enable customer_sessions:write, then set POLAR_ACCESS_TOKEN (or POLAR_CUSTOMER_SESSIONS_TOKEN) and redeploy.",
        },
        { status: 403 }
      );
    }
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
