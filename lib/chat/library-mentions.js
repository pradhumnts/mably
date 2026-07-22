/**
 * Library file/link mentions in chat bodies.
 * Token form: @[file:id|Label] or @[link:id|Label]
 */

const MENTION_RE = /@\[(file|link):([^\]|]+)\|([^\]]*)\]/g;

/**
 * @param {"file" | "link"} kind
 * @param {string} id
 * @param {string} label
 */
export function encodeLibraryMention(kind, id, label) {
  const safeKind = kind === "link" ? "link" : "file";
  const safeId = String(id || "").replace(/[\[\]|]/g, "").trim();
  const safeLabel = String(label || "Untitled")
    .replace(/[\[\]]/g, "")
    .trim()
    .slice(0, 120);
  if (!safeId) return "";
  return `@[${safeKind}:${safeId}|${safeLabel || "Untitled"}]`;
}

/**
 * @param {string | null | undefined} text
 * @returns {Array<
 *   | { type: "text"; value: string }
 *   | { type: "mention"; kind: "file" | "link"; id: string; label: string }
 * >}
 */
export function parseLibraryMentionSegments(text) {
  const raw = String(text || "");
  if (!raw) return [];

  /** @type {ReturnType<typeof parseLibraryMentionSegments>} */
  const segments = [];
  let lastIndex = 0;
  const re = new RegExp(MENTION_RE.source, "g");
  let match = re.exec(raw);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: raw.slice(lastIndex, match.index) });
    }
    const kind = match[1] === "link" ? "link" : "file";
    const id = match[2];
    const label = (match[3] || "").trim() || (kind === "link" ? "Link" : "File");
    segments.push({ type: "mention", kind, id, label });
    lastIndex = match.index + match[0].length;
    match = re.exec(raw);
  }

  if (lastIndex < raw.length) {
    segments.push({ type: "text", value: raw.slice(lastIndex) });
  }

  return segments;
}

/**
 * Active `@query` at caret (not inside an already-encoded token).
 * @param {string} value
 * @param {number} caret
 * @returns {{ start: number; query: string } | null}
 */
export function getActiveLibraryMentionQuery(value, caret) {
  const text = String(value || "");
  const pos = Math.max(0, Math.min(Number(caret) || 0, text.length));
  const before = text.slice(0, pos);
  const match = before.match(/(^|[\s])@([^\s[\]]*)$/);
  if (!match) return null;
  const atIndex = before.length - match[2].length - 1;
  return { start: atIndex, query: match[2] };
}

/**
 * @param {string} projectId
 * @param {"file" | "link"} kind
 * @param {string} id
 */
export function libraryMentionHref(projectId, kind, id) {
  const pid = encodeURIComponent(String(projectId || "").trim());
  const itemId = encodeURIComponent(String(id || "").trim());
  if (!pid || !itemId) return null;
  if (kind === "link") {
    return `/project/${pid}/library/links?link=${itemId}`;
  }
  return `/project/${pid}/library/files?preview=${itemId}`;
}
