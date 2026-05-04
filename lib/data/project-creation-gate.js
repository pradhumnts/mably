import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { countActiveProjectsForCurrentUser } from "@/lib/data/projects";
import {
  hasPaidFreelancerSubscription,
  shouldBlockNewActiveProjectForStarter,
} from "@/lib/billing/project-limits";

/**
 * Why step 5 should block *new* project creation, or `null` if allowed.
 * @returns {Promise<"no_subscription" | "starter_limit" | null>}
 */
export async function getCreateProjectStep5BlockReason() {
  const sub = await getFreelancerSubscriptionForUser();
  if (!hasPaidFreelancerSubscription(sub)) {
    return "no_subscription";
  }
  const n = await countActiveProjectsForCurrentUser();
  if (shouldBlockNewActiveProjectForStarter(sub, n)) {
    return "starter_limit";
  }
  return null;
}
