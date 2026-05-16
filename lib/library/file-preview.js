/** @typedef {"image" | "pdf" | "video" | "audio"} LibraryFilePreviewMode */

/**
 * @param {string} kind
 * @param {string | null | undefined} mime
 * @returns {LibraryFilePreviewMode | null}
 */
export function getLibraryFilePreviewMode(kind, mime) {
  const m = (mime || "").toLowerCase();
  const k = (kind || "").toLowerCase();

  if (k === "image" || m.startsWith("image/")) return "image";
  if (k === "pdf" || m === "application/pdf") return "pdf";
  if (k === "video" || m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";

  return null;
}

/**
 * @param {string} kind
 * @param {string | null | undefined} mime
 */
export function isLibraryFilePreviewable(kind, mime) {
  return getLibraryFilePreviewMode(kind, mime) !== null;
}
