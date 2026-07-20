"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appPath } from "@/lib/site-urls";

const APP_SIGN_IN = appPath("/");
const APP_SIGN_UP = appPath("/?intent=signup");

const NAV_MAX_WIDTH_REM = 72;
const NAV_SCROLL_RANGE_PX = 120;
const NAV_WIDTH_SHRINK = 0.2;

/** Audience pages shown in the Solutions mega menu. */
export const MARKETING_SOLUTIONS = [
  {
    href: "/for/freelancers",
    label: "Freelancers",
    description: "One client portal for files, feedback, and approvals.",
    live: true,
  },
  {
    href: "/for/designers",
    label: "Designers",
    description: "Revisions and sign-off without scattered messages.",
    live: true,
  },
  {
    href: "/for/web-designers",
    label: "Web designers",
    description: "Mockups, staging links, and page approvals before build.",
    live: true,
  },
  {
    href: "/for/agencies",
    label: "Agencies",
    description: "A branded portal for every client engagement.",
    live: true,
  },
  {
    href: "/for/video-editors",
    label: "Video editors",
    description: "Cuts, revisions, and sign-off without chat chaos.",
    live: true,
  },
  {
    href: "/for/photographers",
    label: "Photographers",
    description: "Galleries, selects, and approvals in one branded link.",
    live: true,
  },
  {
    href: "/for/consultants",
    label: "Consultants",
    description: "Clear handoffs for decks, docs, and deliverables.",
    live: true,
  },
];

/**
 * Shared marketing header — landing glass pill + Solutions mega menu.
 * Pricing stays as /#pricing; other hash scroll links are removed.
 * @param {{ theme?: "dark" | "light" }} props — "dark" for heroes with dark
 * media behind the nav (white text at top); "light" for white heroes.
 */
export function MarketingHeader({ theme = "dark" }) {
  const [navScrollProgress, setNavScrollProgress] = useState(0);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef(null);
  const panelRef = useRef(null);

  const scrolled = navScrollProgress > 0.12;
  const navMaxWidthRem = NAV_MAX_WIDTH_REM * (1 - NAV_WIDTH_SHRINK * navScrollProgress);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / NAV_SCROLL_RANGE_PX)
      );
      setNavScrollProgress(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openSolutions = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setSolutionsOpen(true);
  };

  const scheduleCloseSolutions = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setSolutionsOpen(false), 120);
  };

  const onDarkHero = theme === "dark" && !scrolled;
  const navText = onDarkHero ? "text-white/80" : "text-zinc-600";
  const navHover = onDarkHero ? "hover:text-white" : "hover:text-zinc-900";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-0 pt-4 transition-[padding] duration-500",
        scrolled && "max-sm:px-6"
      )}
    >
      <div
        className="relative mx-auto flex h-14 items-center justify-between rounded-full border border-solid px-4 sm:px-0 sm:pl-7 sm:pr-3"
        style={{
          maxWidth: `min(${navMaxWidthRem}rem, calc(100% - 2rem))`,
          backgroundColor:
            navScrollProgress > 0
              ? `rgba(255, 255, 255, ${navScrollProgress * 0.75})`
              : "transparent",
          borderColor: `rgba(0, 0, 0, ${navScrollProgress * 0.06})`,
          boxShadow:
            navScrollProgress > 0
              ? `0 8px 40px -12px rgba(0, 0, 0, ${navScrollProgress * 0.16})`
              : "none",
          backdropFilter:
            navScrollProgress > 0
              ? `blur(${navScrollProgress * 24}px)`
              : "none",
        }}
      >
        <Link href="/" className="flex shrink-0 items-center">
          <img
            src="/images/Logo-SVG.svg"
            alt="Mably"
            className={cn(
              "h-7 w-auto transition duration-500",
              onDarkHero && "brightness-0 invert"
            )}
            draggable={false}
          />
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium transition-colors duration-500 md:flex",
            navText
          )}
        >
          <div
            className="relative"
            onMouseEnter={openSolutions}
            onMouseLeave={scheduleCloseSolutions}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 transition",
                navHover,
                solutionsOpen && (onDarkHero ? "text-white" : "text-zinc-900")
              )}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
              onClick={() => setSolutionsOpen((v) => !v)}
            >
              Solutions
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  solutionsOpen && "rotate-180"
                )}
              />
            </button>

            <div
              ref={panelRef}
              className={cn(
                "absolute left-1/2 top-full z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 pt-5 transition duration-200 sm:pt-6",
                solutionsOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              )}
              onMouseEnter={openSolutions}
              onMouseLeave={scheduleCloseSolutions}
            >
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.22)]">
                <p className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Who it&apos;s for
                </p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {MARKETING_SOLUTIONS.map((item) =>
                    item.live ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-3 py-3 transition hover:bg-zinc-50"
                        onClick={() => setSolutionsOpen(false)}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                          {item.description}
                        </span>
                      </Link>
                    ) : (
                      <div
                        key={item.href}
                        className="rounded-xl px-3 py-3 opacity-60"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                          {item.label}
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                            Soon
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
                          {item.description}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <Link href="/#pricing" className={cn("transition", navHover)}>
            Pricing
          </Link>
          <Link href="/whats-new" className={cn("transition", navHover)}>
            What&apos;s new
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            asChild
            className={cn(
              "hidden rounded-full transition-colors duration-500 sm:inline-flex",
              onDarkHero
                ? "text-white hover:bg-white/15 hover:text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            )}
          >
            <Link href={APP_SIGN_IN}>Sign in</Link>
          </Button>
          <Button
            asChild
            className="hidden rounded-full bg-orange-500 px-5 text-white transition-colors duration-500 hover:bg-orange-600 sm:inline-flex"
          >
            <Link href={APP_SIGN_UP}>Get started</Link>
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full transition md:hidden",
              onDarkHero
                ? "text-white hover:bg-white/15"
                : "text-zinc-800 hover:bg-zinc-100"
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "fixed inset-x-0 top-[4.25rem] z-40 px-4 transition duration-300 md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.22)]">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Who it&apos;s for
            </p>
            <div className="mt-2 space-y-1">
              {MARKETING_SOLUTIONS.map((item) =>
                item.live ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-zinc-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-sm font-semibold text-zinc-900">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {item.description}
                    </span>
                  </Link>
                ) : (
                  <div key={item.href} className="rounded-xl px-3 py-2.5 opacity-60">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      {item.label}
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-500">
                        Soon
                      </span>
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <Link
              href="/#pricing"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/whats-new"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              onClick={() => setMobileOpen(false)}
            >
              What&apos;s new
            </Link>
            <Link
              href={APP_SIGN_IN}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 sm:hidden"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Button
              asChild
              className="mt-1 rounded-full bg-orange-500 text-white hover:bg-orange-600 sm:hidden"
            >
              <Link href={APP_SIGN_UP} onClick={() => setMobileOpen(false)}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </header>
  );
}
