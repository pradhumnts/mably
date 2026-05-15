"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LibraryVoiceWaveformBars } from "@/components/library-voice-waveform-bars";
import { LibraryVoiceUploadProgressButton } from "@/components/library-voice-upload-progress-button";
import {
  getLibraryCommentVoiceSignedUrl,
  markLibraryCommentVoiceListened,
} from "@/lib/actions/project-library";

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const RATES = [1, 1.5, 2];

/**
 * Compact inline voice note player (waveform + play + speed + optional transcript).
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   commentId: string;
 *   durationMs: number;
 *   waveform?: number[] | null;
 *   transcript?: string | null;
 *   listened?: boolean;
 *   localBlob?: Blob | null;
 *   uploadState?: { phase: "preparing" | "uploading" | "saving"; percent: number } | null;
 *   canDelete?: boolean;
 *   onRequestDelete?: () => void;
 * }} props
 */
export function LibraryVoiceNotePlayer({
  projectId,
  fileId,
  commentId,
  durationMs,
  waveform = null,
  transcript = null,
  listened = false,
  localBlob = null,
  uploadState = null,
  canDelete = false,
  onRequestDelete,
}) {
  const audioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));
  const markedRef = useRef(false);
  const [src, setSrc] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(Math.max(0.001, Number(durationMs) / 1000));
  const [rateIdx, setRateIdx] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const peaks = useMemo(() => {
    if (Array.isArray(waveform) && waveform.length >= 8) {
      return waveform.map((n) => Math.max(0, Math.min(1, Number(n) || 0)));
    }
    return Array.from({ length: 40 }, (_, i) => 0.15 + (Math.sin(i * 0.35) + 1) * 0.2);
  }, [waveform]);

  const uploading = Boolean(uploadState);
  const uploadPercent = uploadState?.percent ?? 0;

  const progress = uploading
    ? uploadPercent / 100
    : durationSec > 0
      ? Math.min(1, Math.max(0, currentSec / durationSec))
      : 0;

  const loadUrl = useCallback(async () => {
    if (localBlob) return;
    setLoading(true);
    setLoadErr(null);
    const r = await getLibraryCommentVoiceSignedUrl(
      String(projectId),
      String(fileId),
      String(commentId)
    );
    setLoading(false);
    if (!r.ok || !r.url) {
      setLoadErr(r.error || "Could not load audio");
      return;
    }
    setSrc(r.url);
  }, [projectId, fileId, commentId, localBlob]);

  useEffect(() => {
    if (!localBlob) {
      void loadUrl();
      return undefined;
    }
    const url = URL.createObjectURL(localBlob);
    setSrc(url);
    setLoading(false);
    setLoadErr(null);
    return () => URL.revokeObjectURL(url);
  }, [localBlob, loadUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return undefined;
    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDurationSec(a.duration);
      }
    };
    const onTime = () => {
      setCurrentSec(a.currentTime || 0);
      const dur = a.duration || durationSec;
      if (dur > 0 && a.currentTime / dur >= 0.8 && !markedRef.current) {
        markedRef.current = true;
        void markLibraryCommentVoiceListened(String(projectId), String(fileId), String(commentId));
      }
    };
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
  }, [src, projectId, fileId, commentId, durationSec]);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = RATES[rateIdx] ?? 1;
  }, [rateIdx, src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playing) a.pause();
    else void a.play().catch(() => {});
  };

  const onSeek = (frac) => {
    if (uploading) return;
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return;
    a.currentTime = Math.max(0, Math.min(a.duration, frac * a.duration));
  };

  const hasTranscript = Boolean(transcript && String(transcript).trim()) && !uploading;
  const showDelete = canDelete && !uploading && !localBlob;

  if (loadErr) {
    const missing =
      /not found|object not found|does not exist|404/i.test(String(loadErr)) ||
      String(loadErr).toLowerCase().includes("voice note not found");
    if (missing) {
      return (
        <p
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2 text-xs text-muted-foreground"
          role="status"
        >
          Voice message deleted
        </p>
      );
    }
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {loadErr}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <audio ref={audioRef} src={src || undefined} preload="metadata" className="hidden" />
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2 py-1.5",
          listened && "opacity-90"
        )}
      >
        {uploading ? (
          <LibraryVoiceUploadProgressButton
            percent={uploadPercent}
            phase={uploadState?.phase}
          />
        ) : (
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={loading || !src}
            onClick={() => togglePlay()}
            aria-label={playing ? "Pause" : "Play"}
          >
            {loading ? (
              <span className="text-[10px]">…</span>
            ) : playing ? (
              <Pause className="h-4 w-4" aria-hidden />
            ) : (
              <Play className="h-4 w-4 pl-0.5" aria-hidden />
            )}
          </Button>
        )}

        <LibraryVoiceWaveformBars
          peaks={peaks}
          progress={progress}
          interactive={!uploading}
          onSeek={onSeek}
          className="h-9"
        />

        <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/90">
          {uploading
            ? uploadState?.phase === "saving"
              ? "Saving…"
              : `${Math.round(uploadPercent)}%`
            : playing || currentSec > 0
              ? formatClock(currentSec)
              : formatClock(durationSec)}
        </span>

        {hasTranscript ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 text-muted-foreground",
              showTranscript && "bg-muted text-foreground"
            )}
            onClick={() => setShowTranscript((v) => !v)}
            aria-label={showTranscript ? "Hide transcript" : "Show transcript"}
            title="Transcript"
          >
            <FileText className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}

        {!uploading ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs font-semibold tabular-nums text-muted-foreground hover:text-foreground"
            onClick={() => setRateIdx((i) => (i + 1) % RATES.length)}
            title="Playback speed"
          >
            {RATES[rateIdx]}×
          </Button>
        ) : null}

        {showDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              audioRef.current?.pause();
              onRequestDelete?.();
            }}
            aria-label="Delete voice note"
            title="Delete recording"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      {hasTranscript && showTranscript ? (
        <p className="rounded-md bg-muted/30 px-2 py-1.5 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {String(transcript).trim()}
        </p>
      ) : null}
    </div>
  );
}
