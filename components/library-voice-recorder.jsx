"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Mic, Send, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { addLibraryFileComment, prepareLibraryVoiceNoteUpload } from "@/lib/actions/project-library";
import { MAX_VOICE_NOTE_MS } from "@/lib/library/voice-note-constants";
import { computeVoiceWaveformFromBlob } from "@/lib/library/compute-voice-waveform";
import { uploadProjectLibraryBlobWithProgress } from "@/lib/client/upload-project-library-blob";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";

function pickRecorderMimeType() {
  if (typeof window === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "m4a";
  return "webm";
}

/**
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   disabled?: boolean;
 *   onSent?: () => void;
 *   deferSend?: boolean;
 *   onRecorded?: (p: {
 *     blob: Blob;
 *     waveform: number[] | null;
 *     durationMs: number;
 *     caption: string;
 *   }) => void;
 * }} props
 */
export function LibraryVoiceRecorder({
  projectId,
  fileId,
  disabled = false,
  onSent,
  deferSend = false,
  onRecorded,
}) {
  const [phase, setPhase] = useState("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [caption, setCaption] = useState("");
  const [blob, setBlob] = useState(/** @type {Blob | null} */ (null));
  const [previewUrl, setPreviewUrl] = useState(/** @type {string | null} */ (null));
  const [waveform, setWaveform] = useState(/** @type {number[] | null} */ (null));
  const [durationMs, setDurationMs] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const chunksRef = useRef(/** @type {BlobPart[]} */ ([]));
  const mediaRecorderRef = useRef(/** @type {MediaRecorder | null} */ (null));
  const streamRef = useRef(/** @type {MediaStream | null} */ (null));
  const tickRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));
  const startTsRef = useRef(0);
  const mimeRef = useRef("");

  const cleanupStream = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const resetAll = useCallback(() => {
    cleanupStream();
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setBlob(null);
    setWaveform(null);
    setDurationMs(0);
    setElapsedMs(0);
    setCaption("");
    setPhase("idle");
    setUploading(false);
    setUploadPct(0);
    chunksRef.current = [];
  }, [cleanupStream]);

  const stopRecording = useCallback(async () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") {
      cleanupStream();
      return;
    }
    await new Promise((resolve) => {
      rec.addEventListener("stop", () => resolve(null), { once: true });
      rec.stop();
    });
    cleanupStream();

    const mime = mimeRef.current || "audio/webm";
    const b = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];
    if (!b.size) {
      toast.error("Recording failed", { description: "No audio captured. Check the microphone." });
      setPhase("idle");
      return;
    }
    const { waveform: wf, durationMs: decDur } = await computeVoiceWaveformFromBlob(b);
    const wallMs = Date.now() - startTsRef.current;
    const dur = decDur > 500 ? decDur : Math.max(wallMs, 1000);
    if (dur > MAX_VOICE_NOTE_MS) {
      toast.error("Recording too long", { description: "Voice notes can be up to 3 minutes." });
      setPhase("idle");
      return;
    }
    setBlob(b);
    setWaveform(wf);
    setDurationMs(dur);
    const url = URL.createObjectURL(b);
    setPreviewUrl(url);
    setPhase("preview");
  }, [cleanupStream]);

  const startRecording = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      mimeRef.current = mimeType || "audio/webm";
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      startTsRef.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      rec.start(400);
      tickRef.current = setInterval(() => {
        const e = Date.now() - startTsRef.current;
        setElapsedMs(e);
        if (e >= MAX_VOICE_NOTE_MS) {
          void stopRecording();
        }
      }, 200);
    } catch (e) {
      toast.error("Microphone blocked", {
        description: e?.message || "Allow microphone access to record a voice note.",
      });
    }
  };

  const sendVoice = async () => {
    if (!blob || !previewUrl || uploading) return;

    if (deferSend) {
      if (!waveform) return;
      onRecorded?.({
        blob,
        waveform,
        durationMs,
        caption: caption.trim(),
      });
      resetAll();
      return;
    }

    if (!fileId) {
      toast.error("Missing file", { description: "Open file discussion to send a voice note." });
      return;
    }

    setUploading(true);
    setUploadPct(0);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setUploading(false);
      toast.error("Session expired", { description: "Refresh the page and sign in again." });
      return;
    }

    const prep = await prepareLibraryVoiceNoteUpload({
      projectId: String(projectId),
      sizeBytes: blob.size,
      mimeType: blob.type || mimeRef.current,
      extension: extFromMime(blob.type || mimeRef.current),
    });
    if (!prep.ok || !prep.objectPath) {
      setUploading(false);
      toast.error("Could not start upload", { description: prep.error || "Try again." });
      return;
    }

    const up = await uploadProjectLibraryBlobWithProgress({
      blob,
      objectPath: prep.objectPath,
      accessToken: session.access_token,
      onProgress: (p) => {
        flushSync(() => setUploadPct(p.percent));
      },
    });

    if (!up.ok) {
      setUploading(false);
      toast.error("Upload failed", { description: up.error || "Try again." });
      return;
    }

    const post = await addLibraryFileComment(
      String(projectId),
      String(fileId),
      caption.trim(),
      {
        voice: {
          storagePath: prep.objectPath,
          durationMs,
          mimeType: blob.type || prep.mimeType || null,
          sizeBytes: prep.sizeBytes || blob.size,
          waveform,
        },
      }
    );

    setUploading(false);
    if (!post.ok || !post.comment) {
      void supabase.storage.from("project-library").remove([prep.objectPath]);
      toast.error("Could not post voice note", { description: post.error || "Try again." });
      return;
    }

    toast.success("Voice note sent");
    resetAll();
    onSent?.();
  };

  const label = formatVoiceNoteDurationLabel(elapsedMs);

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 p-3">
      {phase === "idle" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={disabled}
            onClick={() => void startRecording()}
          >
            <Mic className="h-4 w-4" aria-hidden />
            Record voice note
          </Button>
          <span className="text-[11px] text-muted-foreground">Up to 3 min</span>
        </div>
      ) : null}

      {phase === "recording" ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium tabular-nums">{label}</p>
            <p className="text-xs text-muted-foreground">Recording… tap stop when finished</p>
          </div>
          <Button type="button" variant="secondary" size="sm" className="gap-1" onClick={() => void stopRecording()}>
            <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
            Stop
          </Button>
        </div>
      ) : null}

      {phase === "preview" && previewUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Preview</p>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={() => resetAll()}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Discard
            </Button>
          </div>
          <audio src={previewUrl} controls className="h-9 w-full" />
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {formatVoiceNoteDurationLabel(durationMs)}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="voice-caption" className="text-xs">
              Optional caption
            </Label>
            <Input
              id="voice-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a short line with the voice note…"
              disabled={uploading}
              className="text-sm"
            />
          </div>
          {uploading ? (
            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-150"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading… {uploadPct}%</p>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => resetAll()}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="gap-1" disabled={uploading} onClick={() => void sendVoice()}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              {deferSend ? "Attach voice note" : "Send voice note"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
