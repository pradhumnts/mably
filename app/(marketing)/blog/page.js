"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { getAllBlogPosts, formatBlogDate } from "@/lib/marketing/blog-posts";
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

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
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
        {/* ── Hero ── */}
        <section className="bg-[#faf9f6] pb-16 pt-36 sm:pb-20 sm:pt-44">
          <div className="mx-auto max-w-7xl px-4 sm:px-5">
            <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
              Blog
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Freelancer guides &amp; resources
            </h1>
            <p className="mt-4 max-w-xl text-lg text-zinc-500 leading-relaxed">
              Practical advice on client portals, project delivery, and building
              a freelance practice that doesn&apos;t live in your inbox.
            </p>
          </div>
        </section>

        {/* ── Posts grid ── */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-5">
            {posts.length === 0 ? (
              <p className="text-zinc-400">No posts yet — check back soon.</p>
            ) : (
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <article key={post.slug} className="group">
                    <Link href={`/blog/${post.slug}`} className="block overflow-hidden rounded-2xl bg-zinc-100">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          draggable={false}
                        />
                      ) : (
                        <div className="aspect-[16/9] w-full bg-gradient-to-br from-orange-50 to-zinc-100" />
                      )}
                    </Link>

                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="font-semibold uppercase tracking-[0.12em] text-orange-500">
                          {post.category}
                        </span>
                        <span>·</span>
                        <time dateTime={post.publishedAt}>
                          {formatBlogDate(post.publishedAt)}
                        </time>
                        <span>·</span>
                        <span>{post.readingTime}</span>
                      </div>

                      <h2 className="mt-2 text-base font-bold leading-snug text-zinc-900 sm:text-lg">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="transition-colors duration-200 hover:text-orange-500"
                        >
                          {post.title}
                        </Link>
                      </h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                        {post.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

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
          bannerVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
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
