"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * @param {{ demoProjectHref: string }} props
 */
export function DemoPreviewBanner({ demoProjectHref }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-background to-violet-50/40 px-4 py-3 dark:border-orange-900/30 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-300/20 blur-2xl dark:bg-orange-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-violet-300/15 blur-2xl dark:bg-violet-500/10"
      />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden />
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            <span className="font-semibold text-foreground">Not real data.</span> Explore the sample
            project to try chat, files, invoices, and the client portal — nothing below counts toward
            your account.
          </p>
        </div>
        <Link
          href={demoProjectHref}
          className="shrink-0 text-sm font-semibold text-orange-600 underline-offset-4 transition-colors hover:text-orange-700 hover:underline dark:text-orange-300 dark:hover:text-orange-200"
        >
          Open demo project →
        </Link>
      </div>
    </div>
  );
}
