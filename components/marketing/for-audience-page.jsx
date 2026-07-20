"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FallingChips } from "@/components/marketing/falling-chips";
import { cn } from "@/lib/utils";
import { appPath } from "@/lib/site-urls";

const APP_SIGN_UP = appPath("/?intent=signup");
const APP_DEMO = appPath("/?next=%2Fproject%2Fdemo-mably");

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="rounded-2xl bg-white px-5 sm:px-6">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-4 text-left",
          open ? "pt-5 sm:pt-6" : "py-5 sm:py-6"
        )}
        aria-expanded={open}
      >
        <span className="text-base font-semibold leading-snug text-zinc-900 sm:text-[1.05rem]">
          {item.q}
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white"
          aria-hidden
        >
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 pt-4 text-sm leading-relaxed text-zinc-500 sm:pb-6 sm:text-[15px]">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Fit section variant: "statements" (scroll-driven karaoke reveal of big
 * statements) or "checklist" (tappable self-qualification quiz with verdict).
 */
const FIT_VARIANT = "statements";

/**
 * Alternate fit section — each "right for you" line is set in large type and
 * wipes from dim to bright as it scrolls through the viewport, with an orange
 * check stamping in. "Not a replacement for" renders as quiet pills below.
 * @param {{ fit: { forTitle: string; forItems: string[]; notTitle: string; notItems: string[] } }} props
 */
function FitStatements({ fit }) {
  const rootEl = useRef(null);

  useEffect(() => {
    const el = rootEl.current;
    if (!el) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(rootEl);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      el.querySelectorAll("[data-fit-row]").forEach((row) => {
        gsap.fromTo(
          row.querySelector("[data-fit-fill]"),
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            ease: "none",
            scrollTrigger: { trigger: row, start: "top 80%", end: "top 48%", scrub: true },
          }
        );
        gsap.fromTo(
          row.querySelector("[data-fit-check]"),
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: "back.out(2.5)",
            scrollTrigger: {
              trigger: row,
              start: "top 58%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootEl} className="mt-14 sm:mt-16">
      <p data-reveal className="text-sm font-medium text-white/40">
        {fit.forTitle}
      </p>

      <div className="mt-4">
        {fit.forItems.map((item) => (
          <div
            key={item}
            data-fit-row
            className="flex items-center gap-4 border-t border-white/10 py-6 last:border-b sm:gap-6 sm:py-8"
          >
            <span
              data-fit-check
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 sm:h-10 sm:w-10"
              aria-hidden
            >
              <Check className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={3} />
            </span>
            <div className="relative text-xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-4xl">
              <span className="text-white/20">{item}</span>
              <span data-fit-fill className="absolute inset-0 text-white" aria-hidden>
                {item}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 sm:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-sm font-medium text-white/40">{fit.notTitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {fit.notItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/50"
              >
                <X className="h-3.5 w-3.5 text-white/30" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-white/60">Sound like you?</p>
          <Button
            asChild
            className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600"
          >
            <Link href={APP_SIGN_UP}>Get started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive fit check — "right for you" items are tappable checkboxes with
 * a live verdict, so visitors qualify themselves instead of skimming a list.
 * @param {{ fit: { headline: string; forTitle: string; forItems: string[]; notTitle: string; notItems: string[] } }} props
 */
function FitCheck({ fit }) {
  const [checked, setChecked] = useState(() => new Set());

  const toggle = (index) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const count = checked.size;
  const total = fit.forItems.length;
  const verdict =
    count === 0
      ? "Tap the ones that sound like you."
      : count === total
        ? "Perfect match — Mably was built for you."
        : `${count} of ${total} — sounds like Mably could help.`;

  return (
    <div data-reveal-group className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2">
      <div
        data-reveal-item
        className="rounded-[1.75rem] bg-white/[0.06] p-7 ring-1 ring-white/10 sm:p-8"
      >
        <h3 className="text-lg font-semibold text-white">{fit.forTitle}</h3>
        <div className="mt-5 space-y-2.5">
          {fit.forItems.map((item, index) => {
            const isChecked = checked.has(index);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isChecked}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-left text-[15px] transition duration-300",
                  isChecked
                    ? "bg-white/[0.09] text-white"
                    : "bg-white/[0.03] text-white/70 hover:bg-white/[0.07] hover:text-white/90"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition duration-300",
                    isChecked
                      ? "border-orange-500 bg-orange-500"
                      : "border-white/30 bg-transparent"
                  )}
                  aria-hidden
                >
                  <Check
                    className={cn(
                      "h-3 w-3 text-white transition-transform duration-300 ease-out",
                      isChecked ? "scale-100" : "scale-0"
                    )}
                    strokeWidth={3}
                  />
                </span>
                <span>{item}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p
            className={cn(
              "text-sm transition-colors duration-300",
              count === total ? "font-medium text-orange-400" : "text-white/60"
            )}
            aria-live="polite"
          >
            {verdict}
          </p>
          <Button
            asChild
            size="sm"
            className={cn(
              "rounded-full bg-orange-500 px-5 text-white hover:bg-orange-600 transition-all duration-300",
              count > 0
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1 opacity-0"
            )}
          >
            <Link href={APP_SIGN_UP}>Get started</Link>
          </Button>
        </div>
      </div>

      <div
        data-reveal-item
        className="rounded-[1.75rem] border border-white/10 p-7 sm:p-8"
      >
        <h3 className="text-lg font-semibold text-white/90">{fit.notTitle}</h3>
        <ul className="mt-5 space-y-3.5">
          {fit.notItems.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px] text-white/55">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-white/30" strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/40">
          Keep the tools you love — Mably is the calm, client-facing layer on top of them.
        </p>
      </div>
    </div>
  );
}

const PROBLEM_AUTOPLAY_MS = 5000;

/**
 * Autoplaying accordion showcase: item titles stack on the left, the active
 * one expands its subtext with a progress line, and the matching image
 * crossfades on the right. Clicking a title jumps to it and resets the timer.
 * @param {{ items: { title: string; caption: string; image: string }[] }} props
 */
function ProblemShowcase({ eyebrow, headline, items }) {
  const [active, setActive] = useState(0);
  const barRef = useRef(null);
  // Illustrations in /images/for/ ship with alpha — no panel, larger contain fit
  const isTransparentArt = (item) => (item.image || "").includes("/images/for/");
  const activeIsTransparent = isTransparentArt(items[active]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % items.length),
      PROBLEM_AUTOPLAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [active, items.length]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transition = "none";
    bar.style.width = "0%";
    // Force reflow so the reset applies before the linear fill starts
    void bar.offsetWidth;
    bar.style.transition = `width ${PROBLEM_AUTOPLAY_MS}ms linear`;
    bar.style.width = "100%";
  }, [active]);

  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? (
          <p data-reveal className="text-sm font-medium text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h2
          data-split
          className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
        >
          {headline}
        </h2>
      </div>

      <div className="mt-14 grid gap-10 sm:mt-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-24">
        <div data-reveal>
          {items.map((item, index) => {
            const isActive = index === active;
            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className="flex w-full cursor-pointer items-center justify-between py-5 text-left sm:py-6"
                  aria-expanded={isActive}
                >
                  <span
                    className={cn(
                      "text-lg font-semibold tracking-tight transition-colors duration-300 sm:text-xl",
                      isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    {item.title}
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                    isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="max-w-md pb-5 text-sm leading-relaxed text-zinc-500 sm:pb-6 sm:text-[15px]">
                      {item.caption}
                    </p>
                  </div>
                </div>
                <div className="relative h-px w-full bg-zinc-200">
                  {isActive ? (
                    <div
                      ref={barRef}
                      className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-zinc-900"
                      style={{ width: 0 }}
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div
          data-reveal
          className={cn(
            "relative aspect-[5/3] overflow-hidden rounded-[1.75rem] transition-colors duration-700 lg:aspect-[16/11]",
            activeIsTransparent ? "bg-transparent" : "bg-[#f9f8f3]"
          )}
        >
          {items.map((item, index) => (
            <img
              key={item.title}
              src={item.image}
              alt={item.title}
              className={cn(
                "absolute inset-0 h-full w-full transition-opacity duration-700 ease-out",
                isTransparentArt(item) ? "object-contain p-1 sm:p-2" : "object-cover",
                index === active ? "opacity-100" : "opacity-0"
              )}
              draggable={false}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Apple-style horizontal carousel with mixed slide sizes: "portrait" cards
 * (photo background, text overlay) and "landscape" cards (light panel with a
 * UI screenshot pinned to the bottom edge).
 * @param {{ items: { variant?: string; theme?: string; tag?: string; title: string; caption: string; image: string }[] }} props
 */
function LandscapeFeatureCard({ item }) {
  const isDark = item.theme === "dark";

  return (
    <article
      data-feature-card
      data-reveal
      className={cn(
        "flex h-[420px] w-[min(88vw,34rem)] shrink-0 flex-col overflow-hidden rounded-3xl sm:h-[460px] sm:w-[40rem]",
        isDark
          ? "bg-[#3a3834] shadow-[0_12px_40px_-28px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.06]"
          : "bg-white shadow-[0_12px_40px_-28px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.05]"
      )}
    >
      <div className="p-6 sm:p-8">
        {item.tag ? (
          <p className={cn("text-xs font-medium", isDark ? "text-stone-400" : "text-zinc-400")}>
            {item.tag}
          </p>
        ) : null}
        <h3
          className={cn(
            "mt-2 max-w-md text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl",
            isDark ? "text-stone-100" : "text-zinc-900"
          )}
        >
          {item.title}{" "}
          <span className={cn("font-normal", isDark ? "text-stone-400" : "text-zinc-500")}>
            {item.caption}
          </span>
        </h3>
      </div>
      <div
        className={cn(
          "relative ml-6 flex-1 overflow-hidden rounded-tl-2xl sm:ml-8",
          isDark
            ? "bg-[#454340] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.05]"
            : "bg-[#f5f2ed] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.05]"
        )}
      >
        <img
          src={item.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left-top"
          draggable={false}
        />
      </div>
    </article>
  );
}

function FeatureCarousel({ items }) {
  const trackRef = useRef(null);
  const stepIndexRef = useRef(0);
  const [scroll, setScroll] = useState({ canLeft: false, canRight: true });

  /** Snap stops sized to each slide; last stop is maxScroll so wide cards fully appear. */
  const getSnapPositions = (el, cards) => {
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const base = cards[0].offsetLeft;
    const positions = cards.map((card, index) => {
      if (index === cards.length - 1) return maxScroll;
      return Math.min(maxScroll, card.offsetLeft - base);
    });
    return { positions, maxScroll };
  };

  const syncFromScroll = () => {
    const el = trackRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-feature-card]"));
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const { scrollLeft } = el;

    if (cards.length) {
      const { positions } = getSnapPositions(el, cards);
      let closest = 0;
      let best = Infinity;
      positions.forEach((pos, index) => {
        const distance = Math.abs(pos - scrollLeft);
        if (distance < best) {
          best = distance;
          closest = index;
        }
      });
      stepIndexRef.current = closest;
    }

    setScroll({
      canLeft: scrollLeft > 4,
      canRight: scrollLeft < maxScroll - 4,
    });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let scrollEndTimer;
    const onScroll = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      setScroll({
        canLeft: el.scrollLeft > 4,
        canRight: el.scrollLeft < maxScroll - 4,
      });
      clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(syncFromScroll, 100);
    };

    syncFromScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);
    return () => {
      clearTimeout(scrollEndTimer);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, []);

  const scrollToCard = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const cards = Array.from(el.querySelectorAll("[data-feature-card]"));
    if (!cards.length) return;

    const { positions, maxScroll } = getSnapPositions(el, cards);
    const { scrollLeft } = el;
    const canLeft = scrollLeft > 4;
    const canRight = scrollLeft < maxScroll - 4;

    if (direction === "left" && !canLeft) return;
    if (direction === "right" && !canRight) return;

    const last = positions.length - 1;
    let stepIndex = stepIndexRef.current;

    if (direction === "left") {
      stepIndex = Math.max(0, stepIndex - 1);
    } else {
      stepIndex = Math.min(last, stepIndex + 1);
    }

    stepIndexRef.current = stepIndex;
    el.scrollTo({
      left: positions[stepIndex],
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 pl-[max(1rem,calc((100vw-80rem)/2+1rem))] pr-[max(1rem,calc((100vw-80rem)/2+1rem))] sm:gap-5 sm:pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] sm:pr-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) =>
          item.variant === "landscape" ? (
            <LandscapeFeatureCard key={item.title} item={item} />
          ) : (
            <article
              key={item.title}
              data-feature-card
              data-reveal
              className="relative h-[420px] w-[min(78vw,18.5rem)] shrink-0 overflow-hidden rounded-3xl sm:h-[460px] sm:w-[20rem]"
            >
              <img
                src={item.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/40" />
              <div className="relative p-6 sm:p-7">
                {item.tag ? (
                  <p className="text-xs font-medium text-white/70">{item.tag}</p>
                ) : null}
                <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-white sm:text-[1.35rem]">
                  {item.title}
                </h3>
              </div>
              <p className="absolute bottom-6 left-6 right-6 text-sm leading-relaxed text-white/85 sm:bottom-7 sm:left-7 sm:right-7">
                {item.caption}
              </p>
            </article>
          )
        )}
      </div>

      <div className="mx-auto mt-6 flex max-w-7xl justify-end gap-2 px-4 sm:px-5">
        <button
          type="button"
          onClick={() => scrollToCard("left")}
          aria-disabled={!scroll.canLeft}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-opacity",
            scroll.canLeft ? "opacity-100 hover:opacity-60" : "opacity-30"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollToCard("right")}
          aria-disabled={!scroll.canRight}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-opacity",
            scroll.canRight ? "opacity-100 hover:opacity-60" : "opacity-30"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

/**
 * Position/size slots for the scattered hero gallery. Ordered to keep the
 * center clear — content files supply the images, slots control the layout.
 * Small filler tiles only appear on large screens to keep the hero breathy.
 */
const HERO_GALLERY_SLOTS = [
  // Mobile uses rem tops so images sit in the header band; % tops only work once the
  // section is tall (desktop min-height). Sizes stay smaller on phone to leave room for copy.
  {
    pos: "left-[3%] top-[4.75rem] w-[5.75rem] aspect-[3/4] sm:left-[4%] sm:top-[17%] sm:w-[clamp(7rem,13vw,12.5rem)]",
    tilt: "-rotate-3",
  },
  {
    pos: "right-[3%] top-[5.5rem] w-[5.75rem] aspect-[3/4] sm:right-[4%] sm:top-[21%] sm:w-[clamp(7rem,13vw,12.5rem)]",
    tilt: "rotate-2",
  },
  {
    pos: "left-[9%] bottom-[10%] w-[clamp(6.5rem,11.5vw,11rem)] aspect-[3/4] hidden md:block",
    tilt: "rotate-3",
  },
  {
    pos: "right-[8%] bottom-[12%] w-[clamp(6.5rem,11.5vw,11rem)] aspect-[3/4] hidden md:block",
    tilt: "-rotate-2",
  },
  {
    pos: "left-[40%] top-[3.75rem] w-[5rem] aspect-square sm:left-[45%] sm:top-[12%] sm:w-[clamp(6rem,9.5vw,9rem)]",
    tilt: "rotate-2",
  },
  {
    pos: "left-[43%] bottom-[6%] w-[clamp(6rem,10vw,9.5rem)] aspect-square hidden md:block",
    tilt: "-rotate-3",
  },
];

/**
 * Visual-first SEO audience page. Pass content from lib/marketing/for-*.js
 * @param {{ content: typeof import("@/lib/marketing/for-freelancers").FOR_FREELANCERS }} props
 */
export function ForAudiencePage({ content }) {
  const rootRef = useRef(null);
  const [openFaqs, setOpenFaqs] = useState(() => new Set());
  const { hero, problem, solution, steps, stepsIntro, workflows, features, testimonial, fit, faqs, faqHeadline, finalCta, footerBlurb, audience } =
    content;

  const toggleFaq = (key) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const faqMid = Math.ceil(faqs.length / 2);
  const faqLeft = faqs.slice(0, faqMid);
  const faqRight = faqs.slice(faqMid);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia(rootRef);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = [];

      const heroTitle = root.querySelector("[data-hero-title]");
      if (heroTitle) {
        const split = new SplitText(heroTitle, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 64, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.06, ease: "power4.out", delay: 0.15 }
        );
      }

      gsap.fromTo(
        root.querySelectorAll("[data-hero-fade]"),
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power4.out",
          delay: heroTitle ? 0.55 : 0.2,
        }
      );

      const heroImages = root.querySelectorAll("[data-hero-img]");
      if (heroImages.length) {
        gsap.fromTo(
          heroImages,
          { y: 24, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.1,
            stagger: { each: 0.07, from: "random" },
            ease: "power3.out",
            delay: 0.35,
          }
        );

        gsap.to(heroImages, {
          y: -28,
          ease: "none",
          scrollTrigger: {
            trigger: root.querySelector("[data-hero]"),
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      gsap.utils.toArray(root.querySelectorAll("[data-split]")).forEach((el) => {
        const split = new SplitText(el, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.04,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal]")).forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal-group]")).forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-reveal-item]"),
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.1,
            ease: "power4.out",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          }
        );
      });

      return () => {
        splits.forEach((s) => s.revert());
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-white text-zinc-900 antialiased"
    >
      <MarketingHeader theme="light" />

      {/* Hero — scattered "who it's for" gallery around centered copy */}
      <section data-hero className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {(hero.gallery ?? []).slice(0, HERO_GALLERY_SLOTS.length).map((image, index) => (
            <div
              key={image.src}
              data-hero-img
              className={cn("absolute", HERO_GALLERY_SLOTS[index].pos)}
            >
              {/* Tilt lives on an inner wrapper — GSAP owns the outer transform */}
              <div
                className={cn(
                  "h-full w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.3)]",
                  HERO_GALLERY_SLOTS[index].tilt
                )}
              >
                <img
                  src={image.src}
                  alt={image.alt || ""}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl items-start justify-center px-6 pb-12 pt-[17.5rem] sm:min-h-[92svh] sm:items-center sm:pb-24 sm:pt-44">
          <div className="mx-auto max-w-3xl text-center">
            <p
              data-hero-fade
              className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
            >
              {hero.eyebrow}
            </p>
            <h1
              data-hero-title
              className="mt-4 text-balance text-5xl font-semibold leading-[1.06] tracking-[-0.035em] text-zinc-900 sm:text-6xl lg:text-7xl"
            >
              {hero.h1}
            </h1>
            <p
              data-hero-fade
              className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-500 sm:mt-7 sm:text-xl"
            >
              {hero.subhead}
            </p>
            <div
              data-hero-fade
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                asChild
                className="group h-12 rounded-full bg-orange-500 px-8 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.55)] hover:bg-orange-600"
              >
                <Link href={APP_SIGN_UP}>
                  Get started
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 rounded-full border border-zinc-200 bg-white px-8 text-base text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Link href={APP_DEMO}>Explore the demo</Link>
              </Button>
            </div>
            <p data-hero-fade className="mt-5 text-xs text-zinc-400">
              {hero.micro}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorksSection intro={stepsIntro} steps={steps} />

      {/* Solution */}
      <section className="overflow-hidden border-y border-zinc-100 bg-zinc-50 px-4 py-20 sm:px-5 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            data-split
            className="text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
          >
            {solution.headline}
          </h2>
          <p
            data-reveal
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-500 sm:text-lg"
          >
            {solution.subhead}
          </p>

          {solution.chips?.length ? <FallingChips chips={solution.chips} /> : null}
        </div>
      </section>

      {/* Problem */}
      <section className="px-4 py-24 sm:px-5 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <ProblemShowcase
            eyebrow={problem.eyebrow}
            headline={problem.headline}
            items={problem.items}
          />
        </div>
      </section>

      {/* Workflows */}
      <section className="bg-zinc-950 px-4 py-24 text-white sm:px-5 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p data-reveal className="text-sm font-medium text-white/50">
              {workflows.eyebrow}
            </p>
            <h2
              data-split
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]"
            >
              {workflows.headline}
            </h2>
          </div>

          <div data-reveal-group className="mt-14 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6">
            {workflows.items.map((item) => (
              <div key={item.title} data-reveal-item>
                <figure className="overflow-hidden rounded-[1.75rem] bg-zinc-900">
                  <div className="relative aspect-square">
                    <img
                      src={item.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                </figure>
                <p className="mt-5 px-1 text-sm leading-relaxed text-white/55 sm:text-[15px]">
                  <span className="font-semibold text-white">{item.title}.</span>{" "}
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — mixed-size carousel */}
      <section className="overflow-hidden bg-[#f5f2ed] py-24 sm:py-32">
        <div className="mx-auto mb-12 max-w-7xl px-4 sm:mb-14 sm:px-5">
          <p data-reveal className="text-sm font-medium text-zinc-500">
            {features.eyebrow}
          </p>
          <h2
            data-split
            className="mt-3 max-w-lg text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
          >
            {features.headline}
          </h2>
        </div>

        <FeatureCarousel items={features.items} />
      </section>

      {/* Testimonial */}
      <section className="px-4 py-16 sm:px-5 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <figure
            data-reveal
            className="mx-auto grid max-w-5xl items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-14"
          >
            <div className="relative mx-auto w-full max-w-xs lg:max-w-none">
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="aspect-[3/4] w-full rounded-2xl object-cover sm:rounded-3xl"
                draggable={false}
              />
            </div>
            <div>
              <span
                className="block font-serif text-6xl leading-none text-orange-500 sm:text-7xl"
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="mt-3 text-pretty text-2xl font-bold leading-[1.15] tracking-[-0.03em] text-zinc-900 sm:mt-4 sm:text-3xl sm:leading-[1.12] lg:text-[2.25rem] lg:leading-[1.1]">
                {testimonial.quote}
              </blockquote>
              <div className="mt-8 border-t border-zinc-200 pt-6">
                <p className="text-lg font-bold tracking-tight text-zinc-900">
                  {testimonial.name}
                </p>
                <p className="mt-1 text-base text-zinc-500">
                  <a
                    href={testimonial.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 no-underline transition-colors duration-300 ease-out hover:text-zinc-900"
                  >
                    {testimonial.role}
                  </a>
                </p>
              </div>
            </div>
          </figure>
        </div>
      </section>

      {/* Fit */}
      <section className="bg-zinc-950 px-4 py-24 text-white sm:px-5 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2
            data-split
            className="text-center text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl"
          >
            {fit.headline}
          </h2>
          {FIT_VARIANT === "checklist" ? (
            <>
              <p data-reveal className="mx-auto mt-4 max-w-md text-center text-base text-white/50">
                Check everything that sounds like your week.
              </p>
              <FitCheck fit={fit} />
            </>
          ) : (
            <FitStatements fit={fit} />
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-zinc-100 px-4 py-24 sm:px-5 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p data-reveal className="text-sm font-medium text-zinc-500">
              FAQs
            </p>
            <h2
              data-split
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
            >
              {faqHeadline || `Client portals for ${audience?.toLowerCase() || "you"} — answered`}
            </h2>
          </div>

          <div
            data-reveal-group
            className="mt-14 grid gap-4 sm:mt-16 lg:grid-cols-2 lg:gap-5"
          >
            <div className="space-y-4 lg:space-y-5">
              {faqLeft.map((item) => (
                <div key={item.q} data-reveal-item>
                  <FaqItem
                    item={item}
                    open={openFaqs.has(item.q)}
                    onToggle={() => toggleFaq(item.q)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-4 lg:space-y-5">
              {faqRight.map((item) => (
                <div key={item.q} data-reveal-item>
                  <FaqItem
                    item={item}
                    open={openFaqs.has(item.q)}
                    onToggle={() => toggleFaq(item.q)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-5 sm:py-40">
        <img
          src={finalCta.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/65" />
        <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
          <h2
            data-split
            className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]"
          >
            {finalCta.headline}{" "}
            <span className="text-orange-400">{finalCta.accent}</span>
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
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link href={APP_DEMO}>Explore the demo</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter blurb={footerBlurb} />
    </div>
  );
}
