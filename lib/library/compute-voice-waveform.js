import { VOICE_WAVEFORM_BAR_COUNT } from "@/lib/library/voice-note-constants";

/**
 * Downsample decoded audio to normalized peak heights for inline waveform UI.
 * Call only from the browser (uses AudioContext).
 *
 * @param {Blob} blob
 * @param {number} [barCount]
 * @returns {Promise<{ waveform: number[]; durationMs: number }>}
 */
export async function computeVoiceWaveformFromBlob(blob, barCount = VOICE_WAVEFORM_BAR_COUNT) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    const n = Math.max(8, Math.min(128, Math.floor(barCount)));
    return {
      waveform: Array.from({ length: n }, () => 0.15),
      durationMs: 0,
    };
  }
  const ctx = new AudioContextCtor();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const durationMs = Math.round(audioBuffer.duration * 1000);
    const channel = audioBuffer.getChannelData(0);
    const samples = channel.length;
    const bars = Math.max(8, Math.min(128, Math.floor(barCount)));
    const segment = Math.max(1, Math.floor(samples / bars));
    const peaks = [];
    let maxPeak = 0.0001;
    for (let i = 0; i < bars; i++) {
      const start = i * segment;
      const end = Math.min(samples, start + segment);
      let peak = 0;
      for (let j = start; j < end; j++) {
        const v = Math.abs(channel[j] || 0);
        if (v > peak) peak = v;
      }
      peaks.push(peak);
      if (peak > maxPeak) maxPeak = peak;
    }
    return {
      waveform: peaks.map((p) => Math.min(1, p / maxPeak)),
      durationMs,
    };
  } catch {
    const n = Math.max(8, Math.min(128, Math.floor(barCount)));
    return {
      waveform: Array.from({ length: n }, () => 0.2),
      durationMs: 0,
    };
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }
}
