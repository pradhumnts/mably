import { VOICE_WAVEFORM_BAR_COUNT } from "@/lib/library/voice-note-constants";

/** Sentinel stored on demo comment rows — no real audio in storage. */
export const DEMO_VOICE_NOTE_STORAGE_PATH = "__demo_voice__";

export const DEMO_VOICE_PLAYBACK_MESSAGE =
  "This is a sample voice note in the demo project. On a real project, you and your client can record and play messages right in the library.";

/**
 * @param {unknown} path
 * @returns {boolean}
 */
export function isDemoVoiceNoteStoragePath(path) {
  return String(path || "").trim() === DEMO_VOICE_NOTE_STORAGE_PATH;
}

/**
 * Synthetic waveform peaks for demo UI (deterministic per seed).
 * @param {number} [seed]
 * @returns {number[]}
 */
export function buildDemoVoiceWaveform(seed = 0) {
  return Array.from({ length: VOICE_WAVEFORM_BAR_COUNT }, (_, i) => {
    const t = (i + seed * 7) / VOICE_WAVEFORM_BAR_COUNT;
    const envelope = 0.35 + 0.55 * Math.exp(-((t - 0.45) ** 2) / 0.08);
    const wobble = 0.12 * Math.sin(i * 0.55 + seed);
    return Math.max(0.08, Math.min(1, envelope + wobble));
  });
}
