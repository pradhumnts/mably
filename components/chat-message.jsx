import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LibraryVoiceNotePlayer } from "@/components/library-voice-note-player";
import { normalizeVoiceWaveformPeaks } from "@/lib/library/normalize-voice-waveform";

/**
 * @param {{
 *   message: {
 *     id: string;
 *     content?: string;
 *     createdAt: string;
 *     authorId?: string;
 *     optimistic?: boolean;
 *     user: { name?: string };
 *     voiceNote?: {
 *       storagePath?: string | null;
 *       durationMs?: number;
 *       waveform?: number[] | null;
 *       transcript?: string | null;
 *       listened?: boolean;
 *     } | null;
 *     voiceNoteLocalBlob?: Blob | null;
 *     voiceUploadState?: { phase: "preparing" | "uploading" | "saving"; percent: number } | null;
 *   };
 *   isOwnMessage: boolean;
 *   showHeader: boolean;
 *   avatar?: string | null;
 *   projectId?: string;
 *   currentUserId?: string | null;
 *   canModerateVoice?: boolean;
 *   onRequestDeleteVoice?: (target: {
 *     messageId: string;
 *     durationMs: number;
 *     hasMessageText: boolean;
 *   }) => void;
 * }} props
 */
export function ChatMessageItem({
  message,
  isOwnMessage,
  showHeader,
  avatar,
  projectId = "",
  currentUserId = null,
  canModerateVoice = false,
  onRequestDeleteVoice,
}) {
  const hasVoice =
    message.voiceNote?.storagePath &&
    message.voiceNote.storagePath !== "pending" &&
    Number(message.voiceNote.durationMs) > 0;
  const voicePending = message.voiceNote?.storagePath === "pending";
  const showVoice = hasVoice || voicePending;
  const text = message.content?.trim();

  const canDeleteVoice =
    Boolean(
      onRequestDeleteVoice &&
        currentUserId &&
        !message.optimistic &&
        !voicePending &&
        hasVoice &&
        (message.authorId === currentUserId || canModerateVoice)
    );

  return (
    <div className={`flex gap-2 mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatar || undefined} alt={message.user.name} />
          <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn("flex min-w-0 flex-1 flex-col gap-1 max-w-[min(85vw,320px)]", {
          "w-fit flex-none": !showVoice,
          "items-end": isOwnMessage,
        })}
      >
        {showHeader ? (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            {!isOwnMessage && message.user?.name ? (
              <span className="text-foreground/70 font-medium truncate max-w-[10rem]">
                {message.user.name}
              </span>
            ) : null}
            <span className="text-foreground/50 text-xs">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        ) : null}
        <div
          className={cn(
            "space-y-2 text-sm",
            showVoice ? "w-full min-w-0 overflow-hidden py-3 px-3" : "w-fit py-3 px-4",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-[24px]"
              : "bg-white text-foreground rounded-[24px]"
          )}
        >
          {showVoice && projectId ? (
            <div
              className={cn(
                "w-full min-w-0 overflow-hidden",
                isOwnMessage &&
                  "rounded-xl bg-background/95 text-foreground shadow-sm ring-1 ring-black/5"
              )}
            >
              <LibraryVoiceNotePlayer
                projectId={String(projectId)}
                chatMessageId={voicePending ? "" : String(message.id)}
                chatLayout
                durationMs={Number(message.voiceNote?.durationMs) || 0}
                waveform={normalizeVoiceWaveformPeaks(message.voiceNote?.waveform)}
                transcript={message.voiceNote?.transcript ?? null}
                listened={Boolean(message.voiceNote?.listened)}
                localBlob={message.voiceNoteLocalBlob ?? null}
                uploadState={
                  voicePending
                    ? message.voiceUploadState ?? { phase: "preparing", percent: 0 }
                    : null
                }
                canDelete={canDeleteVoice}
                onRequestDelete={() =>
                  onRequestDeleteVoice?.({
                    messageId: String(message.id),
                    durationMs: Number(message.voiceNote?.durationMs) || 0,
                    hasMessageText: Boolean(text),
                  })
                }
              />
            </div>
          ) : null}
          {text ? <p className="whitespace-pre-wrap break-words">{text}</p> : null}
        </div>
      </div>

      {isOwnMessage ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatar || undefined} alt={message.user.name} />
          <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
