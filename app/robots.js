import { getCanonicalMarketingUrl } from "@/lib/marketing/social-share-metadata";

/** robots.txt for mably.io — point crawlers at the marketing sitemap. */
export default function robots() {
  const base = getCanonicalMarketingUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/embed/",
          "/auth/",
          "/onboarding",
          "/portal",
          "/projects",
          "/project/",
          "/settings",
          "/billing",
          "/dashboard",
          "/notifications",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
