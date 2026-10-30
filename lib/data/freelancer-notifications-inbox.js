import { createClient } from "@/lib/supabase/server";
import { getUserFromClaims } from "@/lib/auth/current-user";
import { buildDerivedFreelancerNotifications } from "@/lib/data/freelancer-notifications";
import {
  listFreelancerInboxNotifications,
  syncDerivedItemsToFreelancerInbox,
} from "@/lib/notifications/materialize-freelancer-inbox";

/**
 * Hybrid inbox: sync derived actionable items into DB, then read from materialized table.
 * With `sync: false` only the materialized table is read (one query); returns null when it is
 * empty so callers can keep whatever a previous full sync produced.
 * @param {string} userId
 * @param {{ includeRead?: boolean; sync?: boolean }} [options]
 */
export async function getFreelancerNotificationsHybrid(userId, options = {}) {
  const supabase = await createClient();
  const listOptions = {
    includeRead: options.includeRead ?? false,
    limit: 50,
  };

  if (options.sync === false) {
    const inbox = await listFreelancerInboxNotifications(supabase, userId, listOptions);
    return inbox.length > 0 ? inbox : null;
  }

  const derived = await buildDerivedFreelancerNotifications(userId);

  try {
    await syncDerivedItemsToFreelancerInbox(userId, derived);
  } catch (e) {
    console.error("[inbox] sync derived:", e);
  }

  const inbox = await listFreelancerInboxNotifications(supabase, userId, listOptions);

  if (inbox.length > 0) {
    return inbox;
  }

  // Fallback if migration not applied yet: derived feed only (all treated unread).
  return derived;
}

/**
 * @param {{ includeRead?: boolean; sync?: boolean }} [options]
 */
export async function getFreelancerNotificationsForCurrentUser(options) {
  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return null;
  return getFreelancerNotificationsHybrid(user.id, options);
}
