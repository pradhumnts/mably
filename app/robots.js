import { getCanonicalMarketingUrl } from "@/lib/marketing/social-share-metadata";

/** robots.txt for mably.io — point crawlers at the marketing sitemap. */
export default function robots() {
  const base = getCanonicalMarketingUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/project/demo-mably", "/project/demo-mably/"],
        disallow: [
          "/api/",
          "/embed/",
          "/auth/",
          "/onboarding",
          "/portal",
          "/projects",
          "/project/",
          "/messages",
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
