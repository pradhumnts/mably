"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LibraryVoiceRecordingBar } from "@/components/library-voice-recording-bar";
import { LibraryVoicePreviewPlayer } from "@/components/library-voice-preview-player";
import { useLibraryVoiceComposer } from "@/components/use-library-voice-composer";
import { LibraryVoiceComposerPanel } from "@/components/library-voice-composer-panel";

/**
 * Voice note capture for library composers: mic → recording bar → preview player.
 *
 * @param {{
 *   disabled?: boolean;
 *   pendingVoice?: { blob: Blob; waveform: number[] | null; durationMs: number } | null;
 *   onRecorded: (p: { blob: Blob; waveform: number[] | null; durationMs: number }) => void;
 *   onClear?: () => void;
 *   suppressPreview?: boolean;
 *   compact?: boolean;
 *   className?: string;
 * }} props
 */
export function LibraryVoiceComposer({
  disabled = false,
  pendingVoice = null,
  onRecorded,
  onClear,
  suppressPreview = false,
  compact = false,
  className,
}) {
  const voice = useLibraryVoiceComposer({
    disabled,
    pendingVoice,
    onRecorded,
    onClear,
  });

  const showPreview = Boolean(pendingVoice?.blob) && !voice.recording && !suppressPreview;

  return (
    <div className={cn("space-y-2", className)}>
      {voice.recording ? (
        <LibraryVoiceRecordingBar
          elapsedMs={voice.elapsedMs}
          livePeaks={voice.livePeaks}
          processing={voice.processing}
          onStop={() => void voice.stopRecording()}
        />
      ) : null}

      {showPreview ? (
        <LibraryVoicePreviewPlayer
          blob={pendingVoice.blob}
          waveform={pendingVoice.waveform}
          durationMs={pendingVoice.durationMs}
          disabled={disabled}
          compact={compact}
          onRemove={onClear ? () => voice.clearPending() : undefined}
        />
      ) : null}
    </div>
  );
}

/**
 * Mic trigger for {@link LibraryVoiceComposer} — share state via props from parent hook.
 */
export function LibraryVoiceMicTrigger({
  disabled,
  canRecord,
  onStart,
  className,
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-8 w-8 shrink-0", className)}
      disabled={disabled || !canRecord}
      onClick={() => void onStart()}
      aria-label="Record voice note"
      title="Record voice note"
    >
      <Mic className="h-4 w-4" aria-hidden />
    </Button>
  );
}

/**
 * @param {Parameters<typeof useLibraryVoiceComposer>[0] & { suppressPreview?: boolean; previewDisabled?: boolean; compact?: boolean }} options
 */
export function useLibraryVoiceComposerState(options) {
  const { suppressPreview = false, previewDisabled = false, compact = false, ...hookOptions } = options;
  const voice = useLibraryVoiceComposer(hookOptions);
  const panelVisible =
    voice.recording || Boolean(hookOptions.pendingVoice?.blob && !suppressPreview);

  const panel = (
    <LibraryVoiceComposerPanel visible={panelVisible}>
      {voice.recording ? (
        <LibraryVoiceRecordingBar
          elapsedMs={voice.elapsedMs}
          livePeaks={voice.livePeaks}
          processing={voice.processing}
          onStop={() => void voice.stopRecording()}
        />
      ) : hookOptions.pendingVoice?.blob && !suppressPreview ? (
        <LibraryVoicePreviewPlayer
          blob={hookOptions.pendingVoice.blob}
          waveform={hookOptions.pendingVoice.waveform}
          durationMs={hookOptions.pendingVoice.durationMs}
          disabled={previewDisabled}
          compact={compact}
          onRemove={hookOptions.onClear ? () => voice.clearPending() : undefined}
        />
      ) : null}
    </LibraryVoiceComposerPanel>
  );

  const micButton = (
    <LibraryVoiceMicTrigger
      disabled={hookOptions.disabled}
      canRecord={voice.canRecord}
      onStart={voice.startRecording}
    />
  );
  return { ...voice, panel, micButton, panelVisible };
}
