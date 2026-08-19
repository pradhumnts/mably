import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogPosts } from "@/lib/marketing/blog-posts";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";
import { BlogPostClient } from "@/components/marketing/blog-post-client";

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const title = `${post.title} — Mably Blog`;
  const description = post.description;
  const url = `${getCanonicalMarketingUrl()}/blog/${post.slug}`;
  const base = getSocialShareMetadata({ title, description, url });

  return {
    title,
    description,
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const canonicalUrl = `${getCanonicalMarketingUrl()}/blog/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostClient post={post} />
    </>
  );
}
