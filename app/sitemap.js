import { getCanonicalMarketingUrl } from "@/lib/marketing/social-share-metadata";
import { LEGAL_SLUGS } from "@/lib/marketing/legal-pages";

const FOR_PATHS = [
  "/for/freelancers",
  "/for/designers",
  "/for/web-designers",
  "/for/agencies",
  "/for/video-editors",
  "/for/photographers",
  "/for/consultants",
];

/** Marketing sitemap for mably.io — only publicly indexable pages. */
export default function sitemap() {
  const base = getCanonicalMarketingUrl();
  const now = new Date();

  /** @type {{ url: string; lastModified: Date; changeFrequency: string; priority: number }[]} */
  const entries = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/whats-new`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  for (const path of FOR_PATHS) {
    entries.push({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const slug of LEGAL_SLUGS) {
    entries.push({
      url: `${base}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  return entries;
}
