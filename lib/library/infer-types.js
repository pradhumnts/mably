/** @param {string} rawUrl */
export function inferLinkKindFromUrl(rawUrl) {
  let host = "";
  try {
    const u = new URL(
      rawUrl.trim().startsWith("http://") || rawUrl.trim().startsWith("https://")
        ? rawUrl.trim()
        : `https://${rawUrl.trim()}`
    );
    host = u.hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host.includes("figma.com")) return "figma";
  if (host.includes("framer.com")) return "framer";
  if (host.includes("miro.com")) return "miro";
  if (host.includes("notion.so") || host.includes("notion.site")) return "notion";
  if (host.includes("calendly.com")) return "calendly";
  return "other";
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
  /** Unknown hosts: UI shows a generic link icon instead of a brand asset. */
  other: null,
};

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
