import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * Deduped per request via React `cache`.
 * @returns {Promise<{
 *   polar_customer_id: string | null;
 *   polar_subscription_id: string | null;
 *   status: string;
 *   plan_key: string | null;
 *   current_period_end: string | null;
 *   cancel_at_period_end: boolean;
 * } | null>}
 */
export const getFreelancerSubscriptionForUser = cache(async () => {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  if (!user) return null;

  const { data, error } = await supabase
    .from("freelancer_subscriptions")
    .select(
      "polar_customer_id, polar_subscription_id, status, plan_key, current_period_end, cancel_at_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[billing] get subscription:", error.message);
    return null;
  }

  return data;
});
