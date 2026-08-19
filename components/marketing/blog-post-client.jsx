"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { formatBlogDate, getBlogPost, getAllBlogPosts } from "@/lib/marketing/blog-posts";
import {
  EARLY_OFFER_COPY,
  EARLY_OFFER_DISCOUNT_PERCENT,
  EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT,
  EARLY_OFFER_PLANS,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_SIGN_UP = "https://app.mably.io/?intent=signup";

const EARLY_OFFER_GROWTH_PLAN =
  EARLY_OFFER_PLANS.find((p) => p.key === "growth") ?? EARLY_OFFER_PLANS[1];
const EARLY_OFFER_GROWTH_PRICING = earlyOfferPrice(
  EARLY_OFFER_GROWTH_PLAN.listPriceMonthly
);

/** Share + AI-summarize bar shown below the post title */
function ShareBar({ post }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const encodedUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.href)
      : "";
  const encodedTitle = encodeURIComponent(post.title);

  const shareLinks = [
    {
      label: "Copy link",
      href: null,
      onClick: handleCopy,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      ),
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  const aiLinks = [
    {
      label: "Summarize with Claude",
      href: `https://claude.ai/new?q=Summarize+this+article:+${encodedUrl}`,
      icon: (
        /* Anthropic asterisk-style mark */
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a1 1 0 011 1v7.268l6.294-3.634a1 1 0 011 1.732L14 12l6.294 3.634a1 1 0 01-1 1.732L13 13.732V21a1 1 0 11-2 0v-7.268l-6.294 3.634a1 1 0 01-1-1.732L10 12 3.706 8.366a1 1 0 011-1.732L11 10.268V3a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      label: "Summarize with Gemini",
      href: `https://gemini.google.com/app?q=Summarize+this+article:+${encodedUrl}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a1 1 0 011 1v5h5a1 1 0 010 2h-5v5a1 1 0 01-2 0v-5H6a1 1 0 010-2h5V6a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      label: "Summarize with ChatGPT",
      href: `https://chatgpt.com/?q=Summarize+this+article:+${encodedUrl}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      ),
    },
    {
      label: "Summarize with Perplexity",
      href: `https://www.perplexity.ai/?q=Summarize+this+article:+${encodedUrl}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-start gap-8 border-t border-zinc-100 pt-6">
      {/* Share */}
      <div>
        <p className="mb-2.5 text-xs font-medium text-zinc-400">Share</p>
        <div className="flex items-center gap-1.5">
          {shareLinks.map((item) =>
            item.onClick ? (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                title={copied ? "Copied!" : item.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition",
                  copied && item.label === "Copy link"
                    ? "border-orange-200 bg-orange-50 text-orange-500"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300 hover:text-zinc-700"
                )}
              >
                <span className="sr-only">{item.label}</span>
                {item.icon}
              </button>
            ) : (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={item.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-700"
              >
                <span className="sr-only">{item.label}</span>
                {item.icon}
              </a>
            )
          )}
        </div>
      </div>

      {/* Summarize with AI */}
      <div>
        <p className="mb-2.5 text-xs font-medium text-zinc-400">Summarize with AI</p>
        <div className="flex items-center gap-1.5">
          {aiLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-700"
            >
              <span className="sr-only">{item.label}</span>
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny inline markdown parser.
 * Supports (in priority order):
 *   **[text](url)**  → bold linked text
 *   [text](url)      → linked text
 *   **text**         → bold
 *   *text*           → italic
 */
function parseInline(text) {
  if (!text) return null;
  // Order matters: bold-link must come before plain bold and plain link
  const pattern = /\*\*\[(.+?)\]\((.+?)\)\*\*|\[(.+?)\]\((.+?)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      // **[text](url)**
      nodes.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer"
          className="font-semibold text-zinc-800 underline underline-offset-2 decoration-zinc-300 transition hover:text-orange-500 hover:decoration-orange-400">
          {match[1]}
        </a>
      );
    } else if (match[3] && match[4]) {
      // [text](url)
      nodes.push(
        <a key={key++} href={match[4]} target="_blank" rel="noopener noreferrer"
          className="font-medium text-zinc-800 underline underline-offset-2 decoration-zinc-300 transition hover:text-orange-500 hover:decoration-orange-400">
          {match[3]}
        </a>
      );
    } else if (match[5]) {
      // **bold**
      nodes.push(<strong key={key++} className="font-semibold text-zinc-800">{match[5]}</strong>);
    } else if (match[6]) {
      // *italic*
      nodes.push(<em key={key++}>{match[6]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length === 1 && typeof nodes[0] === "string" ? nodes[0] : nodes;
}

function Inline({ text }) {
  return <>{parseInline(text)}</>;
}

function Block({ block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-12 border-t border-zinc-100 pt-8 text-2xl font-bold text-zinc-900 sm:text-[1.65rem]">
          <Inline text={block.text} />
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-7 text-lg font-semibold text-zinc-900 sm:text-xl">
          <Inline text={block.text} />
        </h3>
      );
    case "p":
      return (
        <p className="mt-5 text-[1.0625rem] leading-[1.85] text-zinc-600">
          <Inline text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul className="mt-5 space-y-3 pl-5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative text-[1.0625rem] leading-[1.8] text-zinc-600 before:absolute before:-left-4 before:top-[0.1em] before:text-orange-400 before:content-['–']"
            >
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-5 list-decimal space-y-3 pl-5 marker:font-semibold marker:text-orange-400">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1 text-[1.0625rem] leading-[1.8] text-zinc-600">
              <Inline text={item} />
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50 px-6 py-5">
          <p className="text-sm font-medium leading-relaxed text-orange-700 sm:text-[1.0625rem]">
            <Inline text={block.text} />
          </p>
        </div>
      );
    case "faq":
      return (
        <div className="mt-8 space-y-4">
          {block.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-4"
            >
              <p className="font-semibold text-zinc-900 sm:text-[1.0625rem]">
                <Inline text={item.q} />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-base">
                <Inline text={item.a} />
              </p>
            </div>
          ))}
        </div>
      );
    case "cta":
      return (
        <div className="my-10 overflow-hidden rounded-2xl bg-zinc-950 px-7 py-8">
          <p className="text-lg font-bold text-white sm:text-xl">
            {block.headline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {block.sub}
          </p>
          <a
            href="https://app.mably.io/?intent=signup"
            className="mt-5 inline-flex items-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            {block.cta}
          </a>
        </div>
      );
    default:
      return null;
  }
}

function RelatedArticles({ slugs }) {
  const posts = slugs
    .map((s) => getBlogPost(s))
    .filter(Boolean)
    .slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <div className="mt-16 border-t border-zinc-100 pt-12 pb-16">
      <h2 className="text-2xl font-bold text-zinc-900">Related articles</h2>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col"
          >
            {/* Cover image */}
            <div className="overflow-hidden rounded-2xl bg-zinc-100">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  draggable={false}
                />
              ) : (
                <div className="aspect-[16/9] w-full bg-zinc-100" />
              )}
            </div>

            {/* Text */}
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-[0.12em] text-orange-500">
                  {post.category}
                </span>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-zinc-900 transition group-hover:text-orange-500 sm:text-base">
                {post.title}
              </p>
              <p className="mt-2 text-xs text-zinc-400">{post.author.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogPostClient({ post }) {
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setBannerVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <MarketingHeader theme="light" />

      <main className={cn(bannerVisible && "")}>
        {/* ── Article hero ── */}
        <section className="bg-[#faf9f6] pb-12 pt-36 sm:pb-16 sm:pt-44">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <nav
              className="flex items-center gap-2 text-xs text-zinc-400"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="transition hover:text-zinc-600">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="transition hover:text-zinc-600">
                Blog
              </Link>
              <span>/</span>
              <span className="line-clamp-1 text-zinc-500">{post.category}</span>
            </nav>

            <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
              <span className="font-medium uppercase tracking-[0.12em] text-orange-500">
                {post.category}
              </span>
              <span>·</span>
              <time dateTime={post.publishedAt}>
                {formatBlogDate(post.publishedAt)}
              </time>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-zinc-500">
              {post.description}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                M
              </div>
              <span className="text-sm font-medium text-zinc-700">
                {post.author.name}
              </span>
            </div>

            <ShareBar post={post} />
          </div>

          {/* Cover image — full width inside the hero, flush at the bottom */}
          {post.coverImage && (
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-t-2xl px-4 sm:px-6">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full rounded-2xl object-cover shadow-sm"
                draggable={false}
              />
            </div>
          )}
        </section>

        {/* ── Article body ── */}
        <section className="bg-white pb-0 pt-12 sm:pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <article>
              {post.content.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </article>

            {/* Back to blog */}
            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                All articles
              </Link>
            </div>

          </div>
        </section>

        {/* ── Related articles — full width ── */}
        {post.related?.length > 0 && (
          <section className="bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-5">
              <RelatedArticles slugs={post.related} />
            </div>
          </section>
        )}

        {/* ── Final CTA — same pattern as /for pages ── */}
        <section className="relative overflow-hidden px-4 py-28 sm:px-5 sm:py-40">
          <img
            src="/images/landing/testimonials.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/65" />
          <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
              Give every client a portal they&apos;ll love.{" "}
              <span className="text-orange-400">
                From ${EARLY_OFFER_GROWTH_PRICING.display}/mo.
              </span>
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={APP_SIGN_UP}
                className="inline-flex h-12 items-center rounded-full bg-orange-500 px-10 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Get started
              </a>
              <a
                href="https://app.mably.io/demo"
                className="inline-flex h-12 items-center rounded-full border border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Explore the demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter noBorder />

      {/* ── Bottom sticky early-bird banner (same as homepage) ── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          bannerVisible
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        )}
        aria-hidden={!bannerVisible}
      >
        <div className="border-t border-zinc-200/90 bg-white/90 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#f5d9b8] via-[#fde8d4] to-[#b8d4f5] sm:h-12 sm:w-12"
              aria-hidden
            >
              <img
                src="/images/Logo-icon.svg"
                alt=""
                className="h-6 w-6 sm:h-7 sm:w-7"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight text-zinc-900 sm:text-[0.9375rem]">
                {EARLY_OFFER_DISCOUNT_PERCENT}% off — first{" "}
                {EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT} subscribers only
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
                ${EARLY_OFFER_GROWTH_PRICING.display}/mo locked in forever for{" "}
                <span className="font-medium text-zinc-900">Growth plan</span>.
                Spots are filling fast.
              </p>
            </div>
            <Button
              size="sm"
              asChild
              className="h-9 shrink-0 rounded-full bg-zinc-900 px-4 text-white hover:bg-zinc-800 sm:h-10 sm:px-5"
            >
              <a href={APP_SIGN_UP}>
                <span className="sm:hidden">{EARLY_OFFER_COPY.stickyCtaLabel}</span>
                <span className="hidden sm:inline">{EARLY_OFFER_COPY.claimCta}</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
