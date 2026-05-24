/**
 * Stable dedupe key for freelancer notifications (derived feed + inbox table).
 * @param {{ type: string; projectId: string; sourceId?: string }} item
 */
export function stableNotificationDedupeKey(item) {
  const type = String(item.type);
  const projectId = String(item.projectId);
  const sourceId = item.sourceId ? String(item.sourceId) : "";
  if (sourceId) return `${type}:${projectId}:${sourceId}`;
  return `${type}:${projectId}`;
}
