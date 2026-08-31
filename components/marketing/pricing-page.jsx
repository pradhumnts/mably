"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingPricingSection } from "@/components/marketing/marketing-pricing-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appPath } from "@/lib/site-urls";
import { DEMO_PORTAL_HREF } from "@/lib/data/demo-project";
import { useMarketingScrollReveal } from "@/hooks/use-marketing-scroll-reveal";
import {
  EARLY_OFFER_COPY,
  EARLY_OFFER_DISCOUNT_PERCENT,
  EARLY_OFFER_FOUNDING_CUSTOMER_LIMIT,
  EARLY_OFFER_PLANS,
  earlyOfferPrice,
} from "@/lib/billing/early-offer";

const APP_SIGN_UP = appPath("/?intent=signup");
const APP_DEMO = appPath(DEMO_PORTAL_HREF);
const FINAL_CTA_IMAGE = "/images/landing/testimonials.webp";

const EARLY_OFFER_GROWTH_PLAN =
  EARLY_OFFER_PLANS.find((p) => p.key === "growth") ?? EARLY_OFFER_PLANS[1];
const EARLY_OFFER_GROWTH_PRICING = earlyOfferPrice(
  EARLY_OFFER_GROWTH_PLAN.listPriceMonthly
);

export function PricingPage() {
  const rootRef = useRef(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useMarketingScrollReveal(rootRef);

  useEffect(() => {
    const onScroll = () => setBannerVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={rootRef} className="min-h-svh bg-white text-zinc-900">
      <MarketingHeader theme="light" />

      <main>
        <MarketingPricingSection className="pt-36 sm:pt-44" headerAnimateOnLoad />

        <section className="relative overflow-hidden px-4 py-28 sm:px-5 sm:py-40">
          <img
            src={FINAL_CTA_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/65" />

          <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
            <h2
              data-split
              className="text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl"
            >
              Make your next client project
              <br />
              <span className="text-orange-400">clearer than the last.</span>
            </h2>
            <div
              data-reveal
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                asChild
                className="group h-12 rounded-full bg-orange-500 px-10 text-white hover:bg-orange-600"
              >
                <Link href={APP_SIGN_UP}>
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              >
                <Link href={APP_DEMO}>Explore the demo workspace</Link>
              </Button>
            </div>
            <p data-reveal className="mt-6 text-sm text-white/60">
              From $9/month · Cancel anytime · One link clients remember
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter blurb="A calmer client experience for freelancers." noBorder />

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
                <span className="font-medium text-zinc-900">Growth plan</span>. Spots are filling
                fast.
              </p>
            </div>
            <Button
              size="sm"
              asChild
              className="h-9 shrink-0 rounded-full bg-zinc-900 px-4 text-white hover:bg-zinc-800 sm:h-10 sm:px-5"
            >
              <Link href={APP_SIGN_UP}>
                <span className="sm:hidden">{EARLY_OFFER_COPY.stickyCtaLabel}</span>
                <span className="hidden sm:inline">{EARLY_OFFER_COPY.claimCta}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
