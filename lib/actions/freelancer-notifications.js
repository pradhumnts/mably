"use server";

import { getFreelancerNotificationsForCurrentUser } from "@/lib/data/freelancer-notifications-inbox";

/**
 * @param {{ includeRead?: boolean }} [options]
 */
export async function fetchFreelancerNotificationsAction(options) {
  try {
    const items = await getFreelancerNotificationsForCurrentUser({
      includeRead: options?.includeRead ?? true,
    });
    return { ok: true, items: items ?? [] };
  } catch (e) {
    console.error("[notifications] fetch:", e);
    return { ok: false, items: [], error: "Could not load notifications" };
  }
}
