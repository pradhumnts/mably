"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";
import { LibraryVoiceWaveformBars } from "@/components/library-voice-waveform-bars";

/**
 * Compact in-progress recording strip (red dot, timer, live waveform, stop).
 *
 * @param {{
 *   elapsedMs: number;
 *   livePeaks: number[];
 *   onStop: () => void;
 *   processing?: boolean;
 *   className?: string;
 * }} props
 */
export function LibraryVoiceRecordingBar({
  elapsedMs,
  livePeaks,
  onStop,
  processing = false,
  className,
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-background px-2.5 py-1.5 shadow-sm",
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/40 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
      </span>

      <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
        {formatVoiceNoteDurationLabel(elapsedMs)}
      </span>

      <LibraryVoiceWaveformBars peaks={livePeaks} live compact className="h-7 min-w-0 flex-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={processing}
        onClick={onStop}
        aria-label="Stop recording"
      >
        <span className="flex gap-[3px]" aria-hidden>
          <span className="h-4 w-[3px] rounded-sm bg-current" />
          <span className="h-4 w-[3px] rounded-sm bg-current" />
        </span>
      </Button>
    </div>
  );
}
