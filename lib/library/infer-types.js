/** @param {string} rawUrl */
export function inferLinkKindFromUrl(rawUrl) {
  let host = "";
  let path = "";
  let href = "";
  try {
    const u = new URL(
      rawUrl.trim().startsWith("http://") || rawUrl.trim().startsWith("https://")
        ? rawUrl.trim()
        : `https://${rawUrl.trim()}`
    );
    host = u.hostname.toLowerCase();
    path = u.pathname.toLowerCase();
    href = u.href.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("figma.com")) return "figma";
  if (host.includes("framer.com")) return "framer";
  if (host.includes("miro.com")) return "miro";
  if (host.includes("notion.so") || host.includes("notion.site")) return "notion";
  if (host.includes("calendly.com")) return "calendly";
  if (host.includes("loom.com")) return "loom";
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) return "drive";
  if (host.includes("dropbox.com")) return "dropbox";
  if (host.includes("github.com") || host.includes("github.io")) return "github";
  if (host.includes("linear.app")) return "linear";
  if (host.includes("slack.com")) return "slack";
  if (
    host.includes("wordpress.com") ||
    path.includes("/wp-admin") ||
    path.includes("wp-login") ||
    href.includes("/wp-admin")
  ) {
    return "wordpress";
  }
  return "other";
}

/**
 * Site favicon for any URL (used when we don't have a local brand asset).
 * @param {string} rawUrl
 * @returns {string | null}
 */
export function faviconUrlForLink(rawUrl) {
  const href = resolveLibraryLinkHref(rawUrl);
  if (!href) return null;
  try {
    const host = new URL(href).hostname;
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return null;
  }
}

/** @param {string} rawUrl @returns {string | null} */
export function resolveLibraryLinkHref(rawUrl) {
  const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

/** @param {string | null | undefined} mime @param {string} filename */
export function inferFileKindFromMime(mime, filename) {
  const m = (mime || "").toLowerCase();
  const ext = (filename || "").split(".").pop()?.toLowerCase() || "";
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  if (m.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(ext))
    return "image";
  if (m.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (m === "application/zip" || ext === "zip" || ext === "rar" || ext === "7z") return "zip";
  if (
    m.includes("spreadsheet") ||
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv"
  )
    return "excel";
  if (m.includes("presentation") || ext === "pptx" || ext === "ppt") return "powerpoint";
  if (ext === "psd") return "photoshop";
  if (ext === "ai") return "illustrator";
  if (ext === "prproj") return "premiere";
  return "other";
}

const linkLogoMap = {
  figma: "/link-logos/figma.svg",
  framer: "/link-logos/framer.svg",
  miro: "/link-logos/miro.svg",
  notion: "/link-logos/notion.svg",
  calendly: "/link-logos/62a9b6cb8ff6441a2952dac4.png",
  wordpress: "/link-logos/wordpress.svg",
  /** These fall through to the site favicon in the UI. */
  loom: null,
  drive: null,
  dropbox: null,
  github: null,
  linear: null,
  slack: null,
  other: null,
};

/**
 * Prefer a local brand mark; otherwise use the site favicon.
 * @param {string} kind
 * @param {string} rawUrl
 * @returns {string | null}
 */
export function resolveLinkLogo(kind, rawUrl) {
  const branded = linkLogoForKind(kind);
  if (branded) return branded;
  return faviconUrlForLink(rawUrl);
}

const fileLogoMap = {
  pdf: "/file-logos/file-pdf.svg",
  image: "/file-logos/image-icon.svg",
  video: "/file-logos/video-icon.svg",
  zip: "/file-logos/zip.png",
  excel: "/file-logos/ms-excel.svg",
  powerpoint: "/file-logos/ms-ppt.svg",
  photoshop: "/file-logos/adobe-photoshop.svg",
  illustrator: "/file-logos/adobe-illustrator.svg",
  premiere: "/file-logos/adobe-premiere pro.svg",
  other: "/file-logos/image-icon.svg",
};

/** @param {string} kind @returns {string | null} */
export function linkLogoForKind(kind) {
  if (Object.prototype.hasOwnProperty.call(linkLogoMap, kind)) {
    return linkLogoMap[kind];
  }
  return linkLogoMap.other;
}

/** @param {string} kind */
export function fileLogoForKind(kind) {
  return fileLogoMap[kind] || fileLogoMap.other;
}
