/**
 * Normalize waveform peaks from DB JSONB, server-action payloads, or JSON strings.
 * @param {unknown} raw
 * @returns {number[] | null}
 */
export function normalizeVoiceWaveformPeaks(raw) {
  if (raw == null) return null;

  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (Array.isArray(arr)) {
    // already an array
  } else if (arr && typeof arr === "object") {
    const keys = Object.keys(arr).filter((k) => /^\d+$/.test(k));
    if (keys.length === 0) return null;
    keys.sort((a, b) => Number(a) - Number(b));
    arr = keys.map((k) => arr[k]);
  } else {
    return null;
  }

  const out = arr.slice(0, 128).map((x) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  });

  return out.length >= 8 ? out : null;
}

/**
 * Reduce peak count for narrow UI (e.g. chat) while preserving shape.
 * @param {number[]} peaks
 * @param {number} targetCount
 * @returns {number[]}
 */
export function downsampleVoiceWaveformPeaks(peaks, targetCount) {
  const src = peaks.map((n) => Math.max(0, Math.min(1, Number(n) || 0)));
  const n = Math.max(8, Math.floor(targetCount));
  if (src.length <= n) return src;

  const out = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor((i / n) * src.length);
    const end = Math.max(start + 1, Math.floor(((i + 1) / n) * src.length));
    let peak = 0;
    for (let j = start; j < end; j++) {
      peak = Math.max(peak, src[j] ?? 0);
    }
    out.push(peak);
  }
  return out;
}

/**
 * @param {unknown} waveform
 * @param {number} [barCount]
 * @returns {number[]}
 */
export function voiceWaveformPeaksForPlayer(waveform, barCount = 40) {
  const target = Math.max(8, Math.floor(barCount));
  const normalized = normalizeVoiceWaveformPeaks(waveform);
  if (normalized?.length) {
    return downsampleVoiceWaveformPeaks(normalized, target);
  }
  return Array.from(
    { length: target },
    (_, i) => 0.15 + (Math.sin(i * 0.35) + 1) * 0.2
  );
}
