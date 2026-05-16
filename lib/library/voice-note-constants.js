/** Max voice note length (3 minutes), both plans. */
export const MAX_VOICE_NOTE_MS = 180_000;

/** Hard cap per recording (bytes); 3 min Opus/WebM rarely exceeds a few MB. */
export const MAX_VOICE_NOTE_BYTES = 8 * 1024 * 1024;

/** Number of bars stored for the waveform strip. */
export const VOICE_WAVEFORM_BAR_COUNT = 64;

export const VOICE_NOTES_STORAGE_PREFIX = "voice-notes";

/** Chat widget voice recordings under `{projectId}/voice-notes/chat/`. */
export const CHAT_VOICE_NOTES_STORAGE_SUBPREFIX = `${VOICE_NOTES_STORAGE_PREFIX}/chat`;
