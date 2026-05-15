"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Play-button slot while a voice note uploads (spinner + circular progress).
 *
 * @param {{
 *   percent: number;
 *   phase?: "preparing" | "uploading" | "saving";
 *   className?: string;
 * }} props
 */
export function LibraryVoiceUploadProgressButton({
  percent,
  phase = "uploading",
  className,
}) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
  const offset = c - (clamped / 100) * c;

  const label =
    phase === "preparing"
      ? "Preparing voice note"
      : phase === "saving"
        ? "Saving voice note"
        : `Uploading voice note ${Math.round(clamped)}%`;

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center",
        className
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      <svg
        className="absolute inset-0 -rotate-90 text-primary"
        viewBox="0 0 36 36"
        aria-hidden
      >
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary/20"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
      </span>
    </div>
  );
}
