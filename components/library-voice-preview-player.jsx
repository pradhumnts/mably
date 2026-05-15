"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";
import { LibraryVoiceWaveformBars } from "@/components/library-voice-waveform-bars";

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Minimal local preview player (play + waveform only) before sending a voice note.
 *
 * @param {{
 *   blob: Blob;
 *   waveform?: number[] | null;
 *   durationMs: number;
 *   disabled?: boolean;
 *   onRemove?: () => void;
 *   compact?: boolean;
 *   className?: string;
 * }} props
 */
export function LibraryVoicePreviewPlayer({
  blob,
  waveform = null,
  durationMs,
  disabled = false,
  onRemove,
  compact = false,
  className,
}) {
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));
  const [src, setSrc] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(Math.max(0.001, Number(durationMs) / 1000));

  const peaks = useMemo(() => {
    if (Array.isArray(waveform) && waveform.length >= 8) {
      return waveform.map((n) => Math.max(0, Math.min(1, Number(n) || 0)));
    }
    return Array.from({ length: compact ? 32 : 40 }, (_, i) => 0.15 + (Math.sin(i * 0.35) + 1) * 0.2);
  }, [waveform, compact]);

  const progress =
    durationSec > 0 ? Math.min(1, Math.max(0, currentSec / durationSec)) : 0;

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return undefined;
    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDurationSec(a.duration);
      }
    };
    const onTime = () => setCurrentSec(a.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrentSec(0);
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  useEffect(() => {
    if (disabled && audioRef.current) {
      audioRef.current.pause();
    }
  }, [disabled]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !src || disabled) return;
    if (playing) a.pause();
    else void a.play().catch(() => {});
  };

  const onSeek = (frac) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0 || disabled) return;
    a.currentTime = Math.max(0, Math.min(a.duration, frac * a.duration));
  };

  const btnSize = compact ? "h-8 w-8" : "h-9 w-9";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2 py-1.5",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <audio ref={audioRef} src={src || undefined} preload="metadata" className="hidden" />
      <Button
        type="button"
        size="icon"
        className={cn(
          btnSize,
          "shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        )}
        disabled={!src || disabled}
        onClick={togglePlay}
        aria-label={playing ? "Pause preview" : "Play preview"}
      >
        {playing ? (
          <Pause className={iconSize} aria-hidden />
        ) : (
          <Play className={cn(iconSize, "pl-0.5")} aria-hidden />
        )}
      </Button>

      <LibraryVoiceWaveformBars
        peaks={peaks}
        progress={progress}
        interactive={!disabled}
        onSeek={onSeek}
        compact={compact}
        className="min-w-0 flex-1"
      />

      <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/90">
        {playing || currentSec > 0
          ? formatClock(currentSec)
          : formatVoiceNoteDurationLabel(durationMs)}
      </span>

      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          disabled={disabled}
          onClick={onRemove}
          aria-label="Remove voice note"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
