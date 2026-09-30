import { notFound } from "next/navigation";
import {
  getAllBlogPosts,
  getBlogPost,
  getBlogPostsBySlugs,
} from "@/lib/marketing/blog-posts";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";
import { BlogPostClient } from "@/components/marketing/blog-post-client";

/** Rebuilt at most every 5 minutes, or straight away when a post is published from Mably HQ. */
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const posts = await getAllBlogPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    // Database unreachable at build time: posts render on first request instead.
    return [];
  }
}

function absoluteImageUrl(src) {
  if (!src) return null;
  return src.startsWith("/") ? `${getCanonicalMarketingUrl()}${encodeURI(src)}` : src;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  const title = `${post.title} — Mably Blog`;
  const description = post.description;
  const url = `${getCanonicalMarketingUrl()}/blog/${post.slug}`;
  const base = getSocialShareMetadata({ title, description, url });
  const cover = absoluteImageUrl(post.coverImage);

  return {
    title,
    description,
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      ...(cover ? { images: [{ url: cover, alt: post.coverAlt || post.title }] } : {}),
    },
    ...(cover ? { twitter: { ...base.twitter, images: [cover] } } : {}),
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = await getBlogPostsBySlugs(post.related);
  const canonicalUrl = `${getCanonicalMarketingUrl()}/blog/${post.slug}`;
  const cover = absoluteImageUrl(post.coverImage);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    ...(cover ? { image: [cover] } : {}),
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: getCanonicalMarketingUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Mably",
      url: getCanonicalMarketingUrl(),
      logo: {
        "@type": "ImageObject",
        url: `${getCanonicalMarketingUrl()}/images/Logo-SVG.svg`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };

  const faqBlock = post.content.find((b) => b.type === "faq");
  const faqSchema = faqBlock
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqBlock.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}

/** JSON for a <script> tag — escapes "<" so post text can't close the tag. */
function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
