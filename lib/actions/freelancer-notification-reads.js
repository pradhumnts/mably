"use server";

import { createClient } from "@/lib/supabase/server";
import { markProjectChatReadByProjectId } from "@/lib/actions/project-chat";
import {
  markFreelancerInboxRead,
  markFreelancerInboxReadMany,
} from "@/lib/notifications/materialize-freelancer-inbox";
import {
  getFreelancerNotificationReadIdsForCurrentUser,
  markFreelancerNotificationsReadForCurrentUser,
} from "@/lib/data/freelancer-notification-reads";

/**
 * @typedef {{ id: string; type?: string; projectId?: string }} DismissEntry
 */

/**
 * @param {DismissEntry[]} entries
 */
async function applyDismissSideEffects(entries) {
  const chatProjects = new Set();
  for (const entry of entries) {
    if (entry.type === "unread_chat" && entry.projectId) {
      chatProjects.add(String(entry.projectId));
    }
  }
  for (const projectId of chatProjects) {
    const chatResult = await markProjectChatReadByProjectId(projectId);
    if (!chatResult.ok) {
      return chatResult;
    }
  }
  return { ok: true };
}

/**
 * @param {DismissEntry[]} entries
 */
async function persistDismiss(entries) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Not signed in" };

  const ids = entries.map((e) => e.id).filter(Boolean);
  if (!ids.length) return { ok: true };

  const inboxResult = await markFreelancerInboxReadMany(supabase, user.id, ids);
  if (!inboxResult.ok) {
    return { ok: false, error: inboxResult.error ?? "Could not dismiss" };
  }

  const legacyResult = await markFreelancerNotificationsReadForCurrentUser(ids);
  if (!legacyResult.ok) {
    return { ok: false, error: legacyResult.error ?? "Could not dismiss" };
  }

  return { ok: true };
}

export async function fetchFreelancerNotificationReadIdsAction() {
  try {
    const ids = await getFreelancerNotificationReadIdsForCurrentUser();
    if (ids === null) return { ok: false, ids: [], error: "Not signed in" };
    return { ok: true, ids };
  } catch (e) {
    console.error("[notification-reads] fetch action:", e);
    return { ok: false, ids: [], error: "Could not load read state" };
  }
}

/**
 * Dismiss one notification (inbox read_at + legacy reads + chat sync).
 * @param {DismissEntry} entry
 */
export async function dismissFreelancerNotificationAction(entry) {
  try {
    const id = String(entry?.id || "").trim();
    if (!id) return { ok: false, error: "Missing notification" };

    const persisted = await persistDismiss([entry]);
    if (!persisted.ok) return persisted;

    const side = await applyDismissSideEffects([entry]);
    if (!side.ok) return { ok: false, error: side.error ?? "Could not sync chat" };

    return { ok: true };
  } catch (e) {
    console.error("[notification-reads] dismiss one:", e);
    return { ok: false, error: "Could not dismiss" };
  }
}

/**
 * @param {DismissEntry[]} entries
 */
export async function dismissFreelancerNotificationsAction(entries) {
  try {
    const normalized = (entries ?? [])
      .map((e) => ({
        id: String(e?.id || "").trim(),
        type: e?.type ? String(e.type) : undefined,
        projectId: e?.projectId ? String(e.projectId) : undefined,
      }))
      .filter((e) => e.id);

    if (!normalized.length) return { ok: true };

    const persisted = await persistDismiss(normalized);
    if (!persisted.ok) return persisted;

    const side = await applyDismissSideEffects(normalized);
    if (!side.ok) return { ok: false, error: side.error ?? "Could not sync chat" };

    return { ok: true };
  } catch (e) {
    console.error("[notification-reads] dismiss many:", e);
    return { ok: false, error: "Could not dismiss" };
  }
}

/** @deprecated Use dismissFreelancerNotificationAction */
export async function markFreelancerNotificationReadAction(notificationId) {
  return dismissFreelancerNotificationAction({ id: notificationId });
}

/** @deprecated Use dismissFreelancerNotificationsAction */
export async function markFreelancerNotificationsReadAction(notificationIds) {
  return dismissFreelancerNotificationsAction(
    (notificationIds ?? []).map((id) => ({ id: String(id) }))
  );
}

/**
 * @param {string[]} legacyIds
 */
export async function syncLegacyFreelancerNotificationReadsAction(legacyIds) {
  try {
    if (!Array.isArray(legacyIds) || legacyIds.length === 0) {
      return { ok: true, ids: await getFreelancerNotificationReadIdsForCurrentUser() };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, ids: [], error: "Not signed in" };

    await markFreelancerInboxReadMany(supabase, user.id, legacyIds);
    const result = await markFreelancerNotificationsReadForCurrentUser(legacyIds);
    if (!result.ok) return { ok: false, ids: [], error: result.error ?? "Could not sync" };

    const ids = await getFreelancerNotificationReadIdsForCurrentUser();
    return { ok: true, ids: ids ?? [] };
  } catch (e) {
    console.error("[notification-reads] legacy sync:", e);
    return { ok: false, ids: [], error: "Could not sync read state" };
  }
}
