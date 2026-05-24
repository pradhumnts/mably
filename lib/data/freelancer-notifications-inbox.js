import { createClient } from "@/lib/supabase/server";
import { buildDerivedFreelancerNotifications } from "@/lib/data/freelancer-notifications";
import {
  listFreelancerInboxNotifications,
  syncDerivedItemsToFreelancerInbox,
} from "@/lib/notifications/materialize-freelancer-inbox";

/**
 * Hybrid inbox: sync derived actionable items into DB, then read from materialized table.
 * @param {string} userId
 * @param {{ includeRead?: boolean }} [options]
 */
export async function getFreelancerNotificationsHybrid(userId, options = {}) {
  const supabase = await createClient();
  const derived = await buildDerivedFreelancerNotifications(userId);

  try {
    await syncDerivedItemsToFreelancerInbox(userId, derived);
  } catch (e) {
    console.error("[inbox] sync derived:", e);
  }

  const inbox = await listFreelancerInboxNotifications(supabase, userId, {
    includeRead: options.includeRead ?? false,
    limit: 50,
  });

  if (inbox.length > 0) {
    return inbox;
  }

  // Fallback if migration not applied yet: derived feed only (all treated unread).
  if (!options.includeRead) {
    return derived;
  }

  return derived;
}

/**
 * @param {{ includeRead?: boolean }} [options]
 */
export async function getFreelancerNotificationsForCurrentUser(options) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return getFreelancerNotificationsHybrid(user.id, options);
}
