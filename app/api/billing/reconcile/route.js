import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reconcilePolarSubscriptionForUser } from "@/lib/billing/reconcile-polar-subscription";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";

export const runtime = "nodejs";

/** POST — refresh subscription row from Polar API (for when webhooks lag or are off). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const r = await reconcilePolarSubscriptionForUser(user.id, {
    email: user.email ?? null,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.error ?? "Reconcile failed" }, { status: 502 });
  }

  const subscription = await getFreelancerSubscriptionForUser();
  return NextResponse.json({ ok: true, synced: Boolean(r.synced), subscription });
}
