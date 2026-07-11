import { getAppOrigin } from "@/lib/site-urls";

function trimOrigin(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

/** Marketing canonical origin — does not fall back to the app host. */
export function getCanonicalMarketingUrl() {
  return trimOrigin(process.env.NEXT_PUBLIC_MARKETING_URL) || "https://mably.io";
}

/** App canonical origin. */
export function getCanonicalAppUrl() {
  return getAppOrigin() || "https://app.mably.io";
}

/** Absolute site origin for Open Graph / canonical metadata. */
export function getMetadataBaseUrl() {
  const origin =
    getCanonicalMarketingUrl() ||
    getCanonicalAppUrl() ||
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
  return `${getCanonicalMarketingUrl()}${LINK_POSTER.path}`;
}

/**
 * @param {{ title?: string; description?: string; url?: string }} [options]
 * `url` should be the absolute page URL (sets og:url + canonical).
 */
export function getSocialShareMetadata({
  title = "Mably — Simple client portal for freelancers",
  description = "A simple client portal for freelancers — manage client communication, files, feedback, approvals, and project handoff in one branded link.",
  url,
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

  /** Optional — only emitted if you set NEXT_PUBLIC_FB_APP_ID in Vercel. */
  const facebookAppId = process.env.NEXT_PUBLIC_FB_APP_ID?.trim() || "";

  return {
    ...(url
      ? {
          alternates: { canonical: url },
        }
      : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "Mably",
      title,
      description,
      ...(url ? { url } : {}),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    ...(facebookAppId
      ? {
          other: {
            "fb:app_id": facebookAppId,
          },
        }
      : {}),
  };
}
