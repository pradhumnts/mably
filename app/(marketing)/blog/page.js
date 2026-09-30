import { getAllBlogPosts } from "@/lib/marketing/blog-posts";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";
import { BlogIndexClient } from "@/components/marketing/blog-index-client";

/** Rebuilt at most every 5 minutes, or straight away when a post is published from Mably HQ. */
export const revalidate = 300;

const TITLE = "Freelancer guides & resources — Mably Blog";
const DESCRIPTION =
  "Practical advice on client portals, project delivery, and building a freelance practice that doesn't live in your inbox.";

export function generateMetadata() {
  const url = `${getCanonicalMarketingUrl()}/blog`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    ...getSocialShareMetadata({ title: TITLE, description: DESCRIPTION, url }),
  };
}

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();
  return <BlogIndexClient posts={posts} />;
}
