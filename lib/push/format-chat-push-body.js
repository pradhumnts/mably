/**
 * @param {string} preview
 * @param {{ isVoice?: boolean; durationMs?: number }} [opts]
 */
export function formatChatPushBody(preview, opts = {}) {
  const raw = typeof preview === "string" ? preview.trim() : "";
  if (raw) {
    return raw.length > 180 ? `${raw.slice(0, 179).trim()}…` : raw;
  }
  if (opts.isVoice) {
    const ms = Number(opts.durationMs);
    if (Number.isFinite(ms) && ms > 0) {
      const sec = Math.max(1, Math.round(ms / 1000));
      return `Voice message (${sec}s)`;
    }
    return "Voice message";
  }
  return "New message";
}
