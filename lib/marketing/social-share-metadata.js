import { getAppOrigin, getMarketingOrigin } from "@/lib/site-urls";

function trimOrigin(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

/** Absolute site origin for Open Graph / canonical metadata. */
export function getMetadataBaseUrl() {
  const origin =
    getMarketingOrigin() ||
    getAppOrigin() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    "https://mably.io";

  return new URL(origin.endsWith("/") ? origin : `${origin}/`);
}

/**
 * Shared social preview image for WhatsApp, Instagram, LinkedIn, etc.
 * JPEG for widest crawler support (WhatsApp is unreliable with WebP).
 */
export const LINK_POSTER = {
  path: "/images/mably-link-poster.jpg",
  width: 1672,
  height: 941,
  alt: "Mably — simple client portal for freelancers",
  type: "image/jpeg",
};

/**
 * Prefer marketing host so the same absolute image URL works when sharing
 * mably.io or app.mably.io. Falls back to mably.io in production.
 */
export function getLinkPosterAbsoluteUrl() {
  const origin =
    trimOrigin(process.env.NEXT_PUBLIC_MARKETING_URL) || "https://mably.io";
  return `${origin}${LINK_POSTER.path}`;
}

export function getSocialShareMetadata({
  title = "Mably — Simple client portal for freelancers",
  description = "A simple client portal for freelancers — manage client communication, files, feedback, approvals, and project handoff in one branded link.",
} = {}) {
  const imageUrl = getLinkPosterAbsoluteUrl();
  const images = [
    {
      url: imageUrl,
      width: LINK_POSTER.width,
      height: LINK_POSTER.height,
      alt: LINK_POSTER.alt,
      type: LINK_POSTER.type,
    },
  ];

  return {
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "Mably",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
