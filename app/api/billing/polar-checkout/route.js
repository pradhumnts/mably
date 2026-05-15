import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFoundingPricingState } from "@/lib/billing/founding-pricing";
import { checkoutErrorMessageFromPayload } from "@/lib/billing/format-polar-api-error";
import {
  getPolarAccessToken,
  getPolarApiBase,
  getPolarServer,
  resolvePolarCheckoutProductId,
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
  const wantFounding = body?.founding === true;

  if (wantFounding) {
    const founding = await getFoundingPricingState();
    if (!founding.configured) {
      return NextResponse.json(
        { error: "Founding pricing is not configured on the server." },
        { status: 500 }
      );
    }
    if (!founding.available) {
      return NextResponse.json(
        { error: "Founding pricing is full. Choose a plan at list price." },
        { status: 409 }
      );
    }
  }

  const productId = resolvePolarCheckoutProductId(plan, { founding: wantFounding });
  if (!productId) {
    return NextResponse.json(
      {
        error: wantFounding
          ? "Missing POLAR_PRODUCT_ID_STARTER_FOUNDING / POLAR_PRODUCT_ID_GROWTH_FOUNDING"
          : "Missing POLAR_PRODUCT_ID_STARTER / POLAR_PRODUCT_ID_GROWTH",
      },
      { status: 500 }
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ?? "";
  const successUrl = site ? `${site}/settings?tab=subscription` : undefined;

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
      metadata: {
        supabase_user_id: user.id,
        ...(wantFounding ? { pricing_tier: "founding" } : {}),
      },
      ...(successUrl ? { success_url: successUrl } : {}),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[polar] checkout create:", res.status, json);
    const env = getPolarServer();
    let message = checkoutErrorMessageFromPayload(json);
    const lower = message?.toLowerCase() ?? "";

    if (res.status === 401 || lower.includes("invalid_token") || lower.includes("invalid token")) {
      message =
        `Polar rejected POLAR_ACCESS_TOKEN (invalid_token). With POLAR_SERVER=${env}, create a new Organization Access Token in the ${env} Polar dashboard (Settings → Developers) and update POLAR_ACCESS_TOKEN. Sandbox and production tokens are not interchangeable.`;
    } else if (lower.includes("does not exist")) {
      message += ` Your app is using Polar ${env} (POLAR_SERVER=${env}). Product IDs and access tokens must come from the same environment.`;
    }

    const clientStatus = res.status === 401 || res.status === 403 ? res.status : 502;
    return NextResponse.json({ error: message }, { status: clientStatus });
  }

  if (!json.url) {
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 502 });
  }

  return NextResponse.json({ url: json.url });
}
