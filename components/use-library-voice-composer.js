"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_VOICE_NOTE_MS } from "@/lib/library/voice-note-constants";
import { computeVoiceWaveformFromBlob } from "@/lib/library/compute-voice-waveform";

const LIVE_BAR_COUNT = 48;

function pickRecorderMimeType() {
  if (typeof window === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function idleLivePeaks() {
  return Array.from({ length: LIVE_BAR_COUNT }, () => 0.12);
}

/**
 * Recording + pending-voice state for library comment composers.
 *
 * @param {{
 *   disabled?: boolean;
 *   pendingVoice?: { blob: Blob; waveform: number[] | null; durationMs: number } | null;
 *   onRecorded: (p: { blob: Blob; waveform: number[] | null; durationMs: number }) => void;
 *   onClear?: () => void;
 * }} options
 */
export function useLibraryVoiceComposer({
  disabled = false,
  pendingVoice = null,
  onRecorded,
  onClear,
}) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [livePeaks, setLivePeaks] = useState(idleLivePeaks);

  const chunksRef = useRef(/** @type {BlobPart[]} */ ([]));
  const mediaRecorderRef = useRef(/** @type {MediaRecorder | null} */ (null));
  const streamRef = useRef(/** @type {MediaStream | null} */ (null));
  const tickRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));
  const rafRef = useRef(/** @type {number | null} */ (null));
  const analyserRef = useRef(/** @type {AnalyserNode | null} */ (null));
  const audioCtxRef = useRef(/** @type {AudioContext | null} */ (null));
  const startTsRef = useRef(0);
  const mimeRef = useRef("");

  const stopAnalyserLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    stopAnalyserLoop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setLivePeaks(idleLivePeaks());
  }, [stopAnalyserLoop]);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const startAnalyserLoop = useCallback((stream) => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / LIVE_BAR_COUNT));
      const next = [];
      for (let i = 0; i < LIVE_BAR_COUNT; i++) {
        let sum = 0;
        const start = i * step;
        for (let j = start; j < start + step; j++) {
          sum += data[j] || 0;
        }
        const avg = sum / step / 255;
        next.push(Math.min(1, 0.1 + avg * 1.4));
      }
      setLivePeaks(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

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

  const startRecording = useCallback(async () => {
    if (disabled || processing || pendingVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startAnalyserLoop(stream);
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
  }, [disabled, processing, pendingVoice, startAnalyserLoop, stopRecording]);

  const clearPending = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const canRecord = !disabled && !recording && !pendingVoice && !processing;

  return {
    recording,
    elapsedMs,
    processing,
    livePeaks,
    canRecord,
    startRecording,
    stopRecording,
    clearPending,
  };
}
