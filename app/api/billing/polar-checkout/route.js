import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPolarAccessToken,
  getPolarApiBase,
  getPolarProductGrowth,
  getPolarProductStarter,
} from "@/lib/billing/polar-env";

export const runtime = "nodejs";

/**
 * Create a Polar hosted checkout session (server-side).
 * Body: `{ "plan": "starter" | "growth" }`
 */
export async function POST(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = body?.plan === "growth" ? "growth" : "starter";
  const productId = plan === "growth" ? getPolarProductGrowth() : getPolarProductStarter();
  if (!productId) {
    return NextResponse.json(
      { error: "Missing POLAR_PRODUCT_ID_STARTER / POLAR_PRODUCT_ID_GROWTH" },
      { status: 500 }
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ?? "";
  const successUrl = site ? `${site}/billing` : undefined;

  const res = await fetch(`${getPolarApiBase()}/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products: [productId],
      customer_email: user.email,
      external_customer_id: user.id,
      metadata: { supabase_user_id: user.id },
      ...(successUrl ? { success_url: successUrl } : {}),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[polar] checkout create:", res.status, json);
    return NextResponse.json(
      { error: json.detail ?? json.message ?? json.error ?? "Checkout failed" },
      { status: 502 }
    );
  }

  if (!json.url) {
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
  }

  return NextResponse.json({ url: json.url });
}
