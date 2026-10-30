"use server";

import { getFreelancerNotificationsForCurrentUser } from "@/lib/data/freelancer-notifications-inbox";

/**
 * `sync: false` skips rebuilding derived notifications and only reads the inbox table;
 * `items` is null when that read found nothing.
 * @param {{ includeRead?: boolean; sync?: boolean }} [options]
 */
export async function fetchFreelancerNotificationsAction(options) {
  const sync = options?.sync ?? true;
  try {
    const items = await getFreelancerNotificationsForCurrentUser({
      includeRead: options?.includeRead ?? true,
      sync,
    });
    return { ok: true, items: sync ? (items ?? []) : items };
  } catch (e) {
    console.error("[notifications] fetch:", e);
    return { ok: false, items: [], error: "Could not load notifications" };
  }
}
