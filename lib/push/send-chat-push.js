import { createAdminClient } from "@/lib/supabase/admin";
import { deliverPushPayload } from "@/lib/push/deliver-push";
import { formatChatPushBody } from "@/lib/push/format-chat-push-body";
import { resolvePushSiteOrigin } from "@/lib/push/site-origin";
import { fetchProjectNotificationTargets } from "@/lib/notifications/project-notification-targets";

/**
 * Send Web Push for a new chat message to everyone on the project except the sender.
 *
 * @param {{
 *   projectId: string;
 *   projectFreelancerId: string;
 *   actorUserId: string;
 *   actorName: string;
 *   preview: string;
 *   isVoice?: boolean;
 *   voiceDurationMs?: number;
 * }} params
 */
export async function sendChatPushNotifications(params) {
  const admin = createAdminClient();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      console.info("[push] Skipping chat push — set SUPABASE_SERVICE_ROLE_KEY.");
    }
    return;
  }

  const pid = String(params.projectId || "").trim();
  const actorUserId = String(params.actorUserId || "").trim();
  if (!pid || !actorUserId) return;

  const targets = await fetchProjectNotificationTargets(pid);
  const recipients = targets.filter(
    (t) =>
      t.userId &&
      t.userId !== actorUserId &&
      t.prefs?.newMessages !== false
  );

  if (!recipients.length) return;

  const userIds = [...new Set(recipients.map((r) => r.userId).filter(Boolean))];
  const { data: subs, error: subErr } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (subErr || !subs?.length) return;

  const { data: project } = await admin
    .from("projects")
    .select("name")
    .eq("id", pid)
    .maybeSingle();

  const projectName = (project?.name ?? "").trim() || "Project";
  const actorName = (params.actorName ?? "").trim() || "Someone";
  const body = formatChatPushBody(params.preview, {
    isVoice: params.isVoice,
    durationMs: params.voiceDurationMs,
  });
  const title = `${actorName} · ${projectName}`;
  const origin = resolvePushSiteOrigin();
  const url = `${origin}/project/${pid}/dashboard?openChat=1`;
  const icon = `${origin}/images/Logo-SVG.svg`;
  const payload = JSON.stringify({
    title,
    body,
    url,
    icon,
    tag: `mably-chat-${pid}`,
  });

  await deliverPushPayload(payload, subs);
}
