"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MAX_VOICE_NOTE_MS } from "@/lib/library/voice-note-constants";
import { computeVoiceWaveformFromBlob } from "@/lib/library/compute-voice-waveform";
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

/**
 * Compact mic control: tap to record, tap stop to attach (no preview step).
 *
 * @param {{
 *   disabled?: boolean;
 *   onRecorded: (p: { blob: Blob; waveform: number[] | null; durationMs: number }) => void;
 *   className?: string;
 * }} props
 */
export function LibraryVoiceMicButton({ disabled = false, onRecorded, className }) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [processing, setProcessing] = useState(false);

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

  const stopRecording = useCallback(async () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") {
      cleanupStream();
      setRecording(false);
      setElapsedMs(0);
      return;
    }

    setProcessing(true);
    await new Promise((resolve) => {
      rec.addEventListener("stop", () => resolve(null), { once: true });
      rec.stop();
    });
    cleanupStream();
    setRecording(false);

    const mime = mimeRef.current || "audio/webm";
    const b = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];

    if (!b.size) {
      setProcessing(false);
      setElapsedMs(0);
      toast.error("Recording failed", { description: "No audio captured." });
      return;
    }

    try {
      const { waveform, durationMs: decDur } = await computeVoiceWaveformFromBlob(b);
      const wallMs = Date.now() - startTsRef.current;
      const dur = decDur > 500 ? decDur : Math.max(wallMs, 1000);
      if (dur > MAX_VOICE_NOTE_MS) {
        toast.error("Recording too long", { description: "Voice notes can be up to 3 minutes." });
        setElapsedMs(0);
        return;
      }
      onRecorded({ blob: b, waveform, durationMs: dur });
      setElapsedMs(0);
    } catch {
      toast.error("Could not process recording");
    } finally {
      setProcessing(false);
    }
  }, [cleanupStream, onRecorded]);

  const startRecording = async () => {
    if (disabled || processing) return;
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
      setRecording(true);
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
        description: e?.message || "Allow microphone access to record.",
      });
    }
  };

  const handleClick = () => {
    if (recording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0",
        recording && "text-destructive hover:text-destructive",
        className
      )}
      disabled={disabled || processing}
      onClick={handleClick}
      aria-label={recording ? "Stop recording" : "Record voice note"}
      title={
        recording
          ? `Recording ${formatVoiceNoteDurationLabel(elapsedMs)} — tap to stop`
          : "Record voice note"
      }
    >
      {processing ? (
        <span className="text-[10px] font-medium">…</span>
      ) : recording ? (
        <Square className="h-4 w-4 fill-current" aria-hidden />
      ) : (
        <Mic className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}
