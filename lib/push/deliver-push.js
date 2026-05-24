import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidConfig } from "@/lib/push/vapid-config";

/**
 * @param {{ endpoint: string; p256dh: string; auth: string }} row
 */
export function subscriptionFromRow(row) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

/**
 * @param {string} statusCode
 */
function isExpiredSubscriptionStatus(statusCode) {
  return statusCode === 404 || statusCode === 410;
}

/**
 * @param {string} payload
 * @param {Array<{ id?: string; endpoint: string; p256dh: string; auth: string }>} subs
 */
export async function deliverPushPayload(payload, subs) {
  const vapid = getVapidConfig();
  const admin = createAdminClient();
  if (!vapid || !admin) {
    return {
      ok: false,
      error: "Push is not configured on the server (VAPID keys or service role).",
      sent: 0,
    };
  }

  if (!subs?.length) {
    return { ok: false, error: "No push subscription saved for this browser.", sent: 0 };
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const staleIds = [];
  let sent = 0;
  let lastError = "";

  for (const row of subs) {
    if (!row?.endpoint || !row.p256dh || !row.auth) continue;
    try {
      await webpush.sendNotification(subscriptionFromRow(row), payload, {
        TTL: 60 * 60 * 24,
      });
      sent += 1;
    } catch (err) {
      const status = err?.statusCode ?? err?.status;
      if (row.id && isExpiredSubscriptionStatus(status)) {
        staleIds.push(row.id);
      }
      lastError =
        typeof err?.body === "string"
          ? err.body
          : err?.message || `Push failed (${status ?? "unknown"})`;
      if (process.env.NODE_ENV === "development") {
        console.warn("[push] send failed:", status, lastError);
      }
    }
  }

  if (staleIds.length) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  if (!sent) {
    return {
      ok: false,
      error: lastError || "Could not deliver push to this browser.",
      sent: 0,
    };
  }

  return { ok: true, sent, error: null };
}
