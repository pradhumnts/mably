import { createClient } from "@/lib/supabase/server";

/**
 * @returns {Promise<{
 *   polar_customer_id: string | null;
 *   polar_subscription_id: string | null;
 *   status: string;
 *   plan_key: string | null;
 *   current_period_end: string | null;
 *   cancel_at_period_end: boolean;
 * } | null>}
 */
export async function getFreelancerSubscriptionForUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
}
