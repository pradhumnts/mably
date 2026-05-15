/**
 * @param {number} ms
 * @returns {string} e.g. "0:42"
 */
export function formatVoiceNoteDurationLabel(ms) {
  const s = Math.max(0, Math.round(Number(ms) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
