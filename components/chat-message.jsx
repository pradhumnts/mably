"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatMessageBody } from "@/components/chat-message-body";
import { ChatMentionInput } from "@/components/chat-mention-input";
import { LibraryVoiceNotePlayer } from "@/components/library-voice-note-player";
import { normalizeVoiceWaveformPeaks } from "@/lib/library/normalize-voice-waveform";

/**
 * @param {{
 *   message: {
 *     id: string;
 *     content?: string;
 *     createdAt: string;
 *     editedAt?: string | null;
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
 *   projectLogo?: string | null;
 *   projectId?: string;
 *   currentUserId?: string | null;
 *   canModerateVoice?: boolean;
 *   onRequestDeleteVoice?: (target: {
 *     messageId: string;
 *     durationMs: number;
 *     hasMessageText: boolean;
 *   }) => void;
 *   onEditMessage?: (messageId: string, body: string) => Promise<boolean> | boolean;
 *   onRequestDeleteMessage?: (target: {
 *     messageId: string;
 *     hasVoice: boolean;
 *   }) => void;
 * }} props
 */
export function ChatMessageItem({
  message,
  isOwnMessage,
  showHeader,
  avatar,
  projectLogo = null,
  projectId = "",
  currentUserId = null,
  canModerateVoice = false,
  onRequestDeleteVoice,
  onEditMessage,
  onRequestDeleteMessage,
}) {
  const hasVoice =
    message.voiceNote?.storagePath &&
    message.voiceNote.storagePath !== "pending" &&
    Number(message.voiceNote.durationMs) > 0;
  const voicePending = message.voiceNote?.storagePath === "pending";
  const showVoice = hasVoice || voicePending;
  const text = message.content?.trim();
  const isEdited = Boolean(message.editedAt);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text || "");
  const [saving, setSaving] = useState(false);
  /** @type {React.MutableRefObject<import("@/components/chat-mention-input").ChatMentionInputHandle | null>} */
  const editInputRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    const next = text || "";
    setDraft(next);
    const t = window.setTimeout(() => {
      editInputRef.current?.setContent(next);
      editInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [editing, text]);

  const canDeleteVoice =
    Boolean(
      onRequestDeleteVoice &&
        currentUserId &&
        !message.optimistic &&
        !voicePending &&
        hasVoice &&
        (message.authorId === currentUserId || canModerateVoice)
    );

  const canManageOwn =
    Boolean(
      isOwnMessage &&
        currentUserId &&
        !message.optimistic &&
        !voicePending &&
        (onEditMessage || onRequestDeleteMessage)
    );

  const canSaveEdit =
    Boolean(draft.trim()) || Boolean(hasVoice);

  const peerAvatar = (
    <div className="relative h-8 w-8 flex-shrink-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar || undefined} alt={message.user.name} />
        <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
      </Avatar>
      {projectLogo ? (
        <Avatar className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 border-[1.5px] border-background">
          <AvatarImage src={projectLogo} alt="" className="object-cover" />
          <AvatarFallback className="rounded-full bg-muted text-[6px]">P</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );

  const handleSaveEdit = async () => {
    if (!onEditMessage || !canSaveEdit || saving) return;
    setSaving(true);
    const ok = await onEditMessage(String(message.id), draft);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const voicePlayer =
    showVoice && projectId ? (
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden",
          isOwnMessage &&
            !editing &&
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
          canDelete={canDeleteVoice && !editing}
          onRequestDelete={() =>
            onRequestDeleteVoice?.({
              messageId: String(message.id),
              durationMs: Number(message.voiceNote?.durationMs) || 0,
              hasMessageText: Boolean(text),
            })
          }
        />
      </div>
    ) : null;

  if (editing) {
    return (
      <div className="-mx-3 mb-4 rounded-lg bg-[#fff8eb] px-3 py-3 sm:-mx-4 sm:px-4">
        <div className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
          {!isOwnMessage ? peerAvatar : null}

          <div className="min-w-0 w-full max-w-[min(100%,28rem)] flex-1 space-y-2">
            {showHeader ? (
              <div
                className={cn("flex items-center gap-2 text-xs", {
                  "justify-end flex-row-reverse": isOwnMessage,
                })}
              >
                {!isOwnMessage && message.user?.name ? (
                  <span className="max-w-[10rem] truncate font-medium text-foreground/70">
                    {message.user.name}
                  </span>
                ) : null}
                <span className="text-xs text-foreground/50">
                  {new Date(message.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  {isEdited ? <span className="ml-1 opacity-80">· edited</span> : null}
                </span>
              </div>
            ) : null}

            {voicePlayer}

            <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm">
              <div className="p-2">
                <ChatMentionInput
                  ref={editInputRef}
                  value={draft}
                  onValueChange={setDraft}
                  onMentionQueryChange={() => {}}
                  multiline
                  placeholder="Edit message"
                  disabled={saving}
                  className="rounded-md border-zinc-200 shadow-none"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setEditing(false);
                      return;
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (canSaveEdit) void handleSaveEdit();
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/80 px-2 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md border-zinc-300 bg-white px-3 text-zinc-700 hover:bg-zinc-50"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-md bg-zinc-800 px-3 text-white hover:bg-zinc-900"
                  disabled={!canSaveEdit || saving}
                  onClick={() => void handleSaveEdit()}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">
              Escape to cancel · ⌘/Ctrl+Enter to save
            </p>
          </div>

          {isOwnMessage ? (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatar || undefined} alt={message.user.name} />
              <AvatarFallback>{message.user.name?.[0]}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex gap-2 mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage ? peerAvatar : null}

      <div
        className={cn("relative flex min-w-0 flex-1 flex-col gap-1 max-w-[min(85vw,320px)]", {
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
              {isEdited ? <span className="ml-1 opacity-80">· edited</span> : null}
            </span>
          </div>
        ) : isEdited ? (
          <div
            className={cn("flex items-center text-[11px] text-foreground/45 px-3", {
              "justify-end": isOwnMessage,
            })}
          >
            edited
          </div>
        ) : null}

        <div className="relative">
          {canManageOwn ? (
            <div
              className={cn(
                "absolute -top-3 z-20 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                isOwnMessage ? "left-1.5" : "right-1.5"
              )}
            >
              <div
                role="toolbar"
                aria-label="Message actions"
                className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-white p-0.5 text-foreground shadow-md ring-1 ring-black/5"
              >
                {onEditMessage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    aria-label="Edit message"
                    title="Edit"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                ) : null}
                {onRequestDeleteMessage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-zinc-600 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete message"
                    title="Delete"
                    onClick={() =>
                      onRequestDeleteMessage({
                        messageId: String(message.id),
                        hasVoice: Boolean(hasVoice),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "space-y-2 text-sm",
              showVoice ? "w-full min-w-0 overflow-hidden py-3 px-3" : "w-fit py-3 px-4",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-[24px]"
                : "bg-muted/80 text-foreground rounded-[24px]"
            )}
          >
            {voicePlayer}
            {text ? (
              <ChatMessageBody
                text={text}
                projectId={projectId}
                isOwnMessage={isOwnMessage}
              />
            ) : null}
          </div>
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
