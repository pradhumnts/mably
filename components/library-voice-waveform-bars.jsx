"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { downsampleVoiceWaveformPeaks } from "@/lib/library/normalize-voice-waveform";

/** Chat strip: downsampled peaks; columns use 1fr so width never exceeds the cell. */
const FLUID_MAX_BARS = 24;

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
 *   dense?: boolean;
 *   fluid?: boolean;
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
  dense = false,
  fluid = false,
  className,
}) {
  const maxH = compact ? 14 : 18;
  const minH = compact ? 4 : 6;
  const barPx = compact || dense || fluid ? 3 : 4;
  const gapPx = 2;

  const displayPeaks = useMemo(() => {
    if (fluid) return downsampleVoiceWaveformPeaks(peaks, FLUID_MAX_BARS);
    return peaks;
  }, [peaks, fluid]);

  const count = Math.max(displayPeaks.length, 1);
  const fixedStripWidth = count * barPx + Math.max(0, count - 1) * gapPx;

  return (
    <div
      className={cn(
        "relative grid items-center",
        fluid ? "h-full w-full max-w-full min-w-0 gap-px" : "gap-[2px]",
        dense && "shrink-0 flex-none",
        !dense && !fluid && "min-w-0 flex-1",
        interactive && "cursor-pointer",
        className
      )}
      style={{
        gridTemplateColumns: dense
          ? `repeat(${count}, ${barPx}px)`
          : `repeat(${count}, minmax(0, 1fr))`,
        width: dense ? fixedStripWidth : fluid ? "100%" : undefined,
        maxWidth: fluid ? "100%" : undefined,
      }}
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
      {displayPeaks.map((h, i) => {
        const barProgress = (i + 1) / displayPeaks.length;
        const played = !live && barProgress <= progress;
        return (
          <span
            key={i}
            className={cn(
              "block shrink-0 justify-self-center rounded-full transition-[height,background-color] duration-75",
              live
                ? "bg-muted-foreground/45"
                : played
                  ? "bg-primary"
                  : "bg-muted-foreground/35"
            )}
            style={{
              width: fluid || dense ? barPx : `min(100%, ${barPx}px)`,
              minWidth: fluid || dense ? barPx : undefined,
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
