/** Subscription statuses where plan limits apply (not canceled / unpaid). */
const PAID_LIKE = new Set(["active", "trialing", "past_due"]);

export function isPaidSubscriptionStatus(status) {
  return PAID_LIKE.has(String(status ?? "").toLowerCase());
}

/** Polar subscription row exists and is in a paid / current billing state. */
export function hasPaidFreelancerSubscription(subscription) {
  return Boolean(subscription && isPaidSubscriptionStatus(subscription.status));
}

/**
 * Starter plan: one concurrent `active` project. Growth: unlimited (no cap here).
 */
export function shouldBlockNewActiveProjectForStarter(subscription, activeProjectCount) {
  if (!subscription || !isPaidSubscriptionStatus(subscription.status)) return false;
  if (String(subscription.plan_key ?? "").toLowerCase() !== "starter") return false;
  return activeProjectCount >= 1;
}
