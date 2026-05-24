"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dashed panel treatment so demo blocks never look like live dashboard cards. */
export const demoPreviewPanelClass =
  "border-dashed border-orange-200/70 bg-orange-50/25 shadow-none ring-1 ring-inset ring-orange-200/35 dark:border-orange-900/55 dark:bg-orange-950/20 dark:ring-orange-900/40";

/**
 * @param {{ className?: string }} props
 */
export function DemoPreviewBadge({ className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-orange-200/70 bg-orange-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/50 dark:text-orange-200",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
      Example
    </span>
  );
}

/**
 * @param {{ children: React.ReactNode; className?: string }} props
 */
export function DemoPreviewNotice({ children, className }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-dashed border-orange-200/60 bg-orange-50/50 px-3.5 py-2.5 dark:border-orange-900/45 dark:bg-orange-950/25",
        className
      )}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden />
      <p className="text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}
