import { sendChatPushNotifications } from "@/lib/push/send-chat-push";

/**
 * @param {object} p
 * @param {string} p.projectId
 * @param {string} p.projectFreelancerId
 * @param {string} p.actorUserId
 * @param {string} p.actorName
 * @param {string} p.preview
 * @param {boolean} [p.isVoice]
 * @param {number} [p.voiceDurationMs]
 */
export function notifyPortalChatPushMessage(p) {
  void sendChatPushNotifications({
    projectId: p.projectId,
    projectFreelancerId: p.projectFreelancerId,
    actorUserId: p.actorUserId,
    actorName: p.actorName,
    preview: p.preview ?? "",
    isVoice: Boolean(p.isVoice),
    voiceDurationMs: p.voiceDurationMs,
  });
}
