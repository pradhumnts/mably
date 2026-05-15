"use client";

import { cn } from "@/lib/utils";

/**
 * Inline waveform strip (static peaks or live levels).
 *
 * @param {{
 *   peaks: number[];
 *   progress?: number;
 *   interactive?: boolean;
 *   onSeek?: (frac: number) => void;
 *   live?: boolean;
 *   compact?: boolean;
 *   className?: string;
 * }} props
 */
export function LibraryVoiceWaveformBars({
  peaks,
  progress = 0,
  interactive = false,
  onSeek,
  live = false,
  compact = false,
  className,
}) {
  const maxH = compact ? 14 : 18;
  const minH = compact ? 4 : 6;
  const barMaxW = compact ? 3 : 4;

  return (
    <div
      className={cn(
        "relative grid min-w-0 flex-1 items-center gap-[2px]",
        interactive && "cursor-pointer",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${Math.max(peaks.length, 1)}, minmax(0, 1fr))` }}
      role={interactive ? "slider" : undefined}
      aria-label={interactive ? "Seek voice note" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive && onSeek
          ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeek((e.clientX - rect.left) / rect.width);
            }
          : undefined
      }
      onKeyDown={
        interactive && onSeek
          ? (e) => {
              if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
              if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
            }
          : undefined
      }
    >
      {peaks.map((h, i) => {
        const barProgress = (i + 1) / peaks.length;
        const played = !live && barProgress <= progress;
        return (
          <span
            key={i}
            className={cn(
              "justify-self-center rounded-full transition-[height,background-color] duration-75",
              live
                ? "bg-muted-foreground/45"
                : played
                  ? "bg-primary"
                  : "bg-muted-foreground/35"
            )}
            style={{
              width: `min(100%, ${barMaxW}px)`,
              height: `${minH + h * maxH}px`,
            }}
            aria-hidden
          />
        );
      })}
      {!live && progress > 0 ? (
        <span
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-primary"
          style={{ left: `${progress * 100}%` }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
