/** @param {unknown} value */
export function formatLibraryVersionLabel(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return "v1";
  return `v${Math.round(n)}`;
}

/** @param {unknown} value */
export function formatRevisionCountLabel(value) {
  const n = Math.max(1, Number(value) || 1);
  return n === 1 ? "1 Revision" : `${n} Revisions`;
}

/** @param {unknown} value @param {boolean} [isCurrent] */
export function formatRevisionLabel(value, isCurrent = false) {
  const n = Math.max(1, Number(value) || 1);
  const label = n === 1 ? "Revision 1" : `Revision ${n}`;
  return isCurrent ? `${label} · Current` : label;
}

/** @param {string | null | undefined} iso */
export function formatLibraryDateTime(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
