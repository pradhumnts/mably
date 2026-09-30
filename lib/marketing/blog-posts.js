import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export { formatBlogDate } from "@/lib/marketing/blog-format";

/**
 * Mably blog posts, stored in the `blog_posts` table and written in Mably HQ (the staff
 * tool). Reads use the public anon key, so row-level security only returns posts
 * that are published and whose publish time has passed — drafts can never leak here.
 *
 * Each post has a `content` array of typed blocks rendered by BlogPostClient:
 *   { type: "p" | "h2" | "h3" | "callout", text: string }
 *   { type: "ul" | "ol", items: string[] }
 *   { type: "cta", headline: string, sub: string, cta: string }
 *   { type: "faq", items: { q: string; a: string }[] }
 *   { type: "image", url: string, alt: string, caption: string }
 * Text supports **bold**, *italic* and [links](https://…).
 */

const LIST_COLUMNS =
  "slug, title, description, category, cover_image, cover_alt, author_name, related, reading_minutes, published_at, updated_at";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function livePosts(columns) {
  return publicClient()
    .from("blog_posts")
    .select(columns)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString());
}

/** The blog_posts migration hasn't been run yet: behave as if there are no posts. */
function isMissingTable(error) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

function toPost(row) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingTime: `${row.reading_minutes} min read`,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    related: row.related ?? [],
    author: { name: row.author_name, avatar: null },
    content: Array.isArray(row.content) ? row.content : [],
  };
}

/**
 * All live posts, newest first (without article content). Throws if the database is
 * unreachable, so a timed rebuild keeps serving the previous page instead of an empty blog.
 */
export const getAllBlogPosts = cache(async () => {
  const { data, error } = await livePosts(LIST_COLUMNS).order("published_at", {
    ascending: false,
  });
  if (isMissingTable(error)) return [];
  if (error) throw new Error(`Could not load blog posts: ${error.message}`);
  return (data ?? []).map(toPost);
});

/** One live post with its content, or null. */
export const getBlogPost = cache(async (slug) => {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const { data, error } = await livePosts(`${LIST_COLUMNS}, content`)
    .eq("slug", slug)
    .maybeSingle();
  if (isMissingTable(error)) return null;
  if (error) throw new Error(`Could not load blog post: ${error.message}`);
  return data ? toPost(data) : null;
});

/** Live posts for the given slugs, in the given order (for "Related articles"). */
export async function getBlogPostsBySlugs(slugs) {
  const wanted = (slugs ?? []).filter((s) => typeof s === "string").slice(0, 3);
  if (wanted.length === 0) return [];
  const posts = await getAllBlogPosts();
  return wanted.map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);
}
