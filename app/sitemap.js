import { getCanonicalMarketingUrl } from "@/lib/marketing/social-share-metadata";
import { LEGAL_SLUGS } from "@/lib/marketing/legal-pages";
import { getAllBlogPosts } from "@/lib/marketing/blog-posts";

/** Picks up new blog posts at most every 5 minutes, or straight away when a post is published from Mably HQ. */
export const revalidate = 300;

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
export default async function sitemap() {
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

  try {
    const posts = await getAllBlogPosts();
    entries.push({
      url: `${base}/blog`,
      lastModified: posts[0] ? new Date(posts[0].publishedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const post of posts) {
      entries.push({
        url: `${base}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt ?? post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch {
    // Blog database unreachable: still serve the rest of the sitemap.
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
