"use client";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import {
  ChatLibraryMentionPicker,
  buildLibraryMentionItems,
  filterLibraryMentionItems,
} from "@/components/chat-library-mention-picker";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useProjectMessages } from "@/hooks/use-project-messages";
import { useLibraryVoiceComposerState } from "@/components/library-voice-composer";
import { DeleteChatVoiceMessageDialog } from "@/components/delete-chat-voice-message-dialog";
import { ChatMentionInput } from "@/components/chat-mention-input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isDemoProjectId } from "@/lib/data/demo-project";
import {
  listLibraryFiles,
  listLibraryLinks,
} from "@/lib/actions/project-library";

export function RealtimeChat({
  projectId,
  conversationId,
  currentUserId,
  initialMessages = [],
  userRole,
  clientAvatar,
  freelancerAvatar,
  projectLogo = null,
  senderDisplayName,
  selfAvatarUrl,
  onRemoteMessage,
  disabled = false,
}) {
  const { containerRef, scrollToBottom } = useChatScroll();
  const isDemoChat = isDemoProjectId(String(projectId));
  /** @type {React.MutableRefObject<import("@/components/chat-mention-input").ChatMentionInputHandle | null>} */
  const mentionInputRef = useRef(null);

  const { messages, sendMessage, sendVoiceMessage, removeMessage, replaceMessage, isConnected } =
    useProjectMessages({
      projectId,
      conversationId,
      currentUserId,
      initialMessages,
      onRemoteMessage,
      senderDisplayName,
      selfAvatarUrl,
    });

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  /** @type {[null | { blob: Blob; waveform: number[] | null; durationMs: number }, React.Dispatch<any>]} */
  const [pendingVoice, setPendingVoice] = useState(null);
  /** @type {[null | { messageId: string; durationMs: number; hasMessageText: boolean }, React.Dispatch<any>]} */
  const [deleteVoiceTarget, setDeleteVoiceTarget] = useState(null);

  /** @type {[any[], React.Dispatch<any>]} */
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  /** @type {[{ start: number; query: string } | null, React.Dispatch<any>]} */
  const [mentionState, setMentionState] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const voiceComposer = useLibraryVoiceComposerState({
    disabled: disabled || sending || isDemoChat,
    pendingVoice,
    onRecorded: setPendingVoice,
    onClear: () => setPendingVoice(null),
    compact: true,
    suppressPreview: false,
    previewDisabled: sending,
  });

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, scrollToBottom, pendingVoice, voiceComposer.recording]);

  const ensureLibraryLoaded = useCallback(async () => {
    if (libraryLoaded || libraryLoading || !projectId || isDemoChat) return;
    setLibraryLoading(true);
    try {
      const [filesRes, linksRes] = await Promise.all([
        listLibraryFiles(String(projectId)),
        listLibraryLinks(String(projectId)),
      ]);
      setLibraryItems(
        buildLibraryMentionItems(
          filesRes.ok ? filesRes.items : [],
          linksRes.ok ? linksRes.items : []
        )
      );
      setLibraryLoaded(true);
    } finally {
      setLibraryLoading(false);
    }
  }, [libraryLoaded, libraryLoading, projectId, isDemoChat]);

  const filteredMentions = useMemo(
    () =>
      filterLibraryMentionItems(
        libraryItems,
        mentionState?.query || "",
        8
      ),
    [libraryItems, mentionState?.query]
  );

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionState?.query, mentionState?.start, filteredMentions.length]);

  const syncMentionFromInput = useCallback(
    (active) => {
      if (isDemoChat) {
        setMentionState(null);
        return;
      }
      setMentionState(active);
      if (active) void ensureLibraryLoaded();
    },
    [ensureLibraryLoaded, isDemoChat]
  );

  const insertMention = useCallback((item) => {
    if (!item) return;
    mentionInputRef.current?.insertMention(item);
    setMentionState(null);
  }, []);

  const avatarFor = useCallback(
    (message, isOwn) => {
      if (message.authorAvatarUrl) return message.authorAvatarUrl;
      if (isOwn) {
        return userRole === "client" ? clientAvatar : freelancerAvatar;
      }
      return userRole === "client" ? freelancerAvatar : clientAvatar;
    },
    [clientAvatar, freelancerAvatar, userRole]
  );

  const canSend = Boolean(
    conversationId &&
      isConnected &&
      !disabled &&
      !sending &&
      !voiceComposer.recording &&
      !voiceComposer.processing &&
      (newMessage.trim() || pendingVoice)
  );

  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const text = newMessage.trim();
      const voice = pendingVoice;
      if ((!text && !voice) || !canSend) return;

      setSending(true);
      const draftText = newMessage;
      setNewMessage("");
      mentionInputRef.current?.clear();
      setPendingVoice(null);
      setMentionState(null);

      let ok;
      if (voice) {
        ok = await sendVoiceMessage({
          blob: voice.blob,
          waveform: voice.waveform,
          durationMs: voice.durationMs,
          body: text,
          mimeType: voice.blob.type,
        });
      } else {
        ok = await sendMessage(text);
      }

      setSending(false);
      if (!ok) {
        setNewMessage(draftText);
        // Restore plain text only; chips are re-typed if send fails (rare).
        if (voice) setPendingVoice(voice);
      }
    },
    [newMessage, pendingVoice, canSend, sendMessage, sendVoiceMessage]
  );

  const showSendButton = Boolean(newMessage.trim() || pendingVoice) && canSend;
  const inputDisabled =
    !conversationId || !isConnected || disabled || sending || voiceComposer.recording;

  const canModerateVoice = userRole === "freelancer";

  return (
    <div className="flex min-h-0 h-full w-full flex-col text-foreground antialiased">
      <DeleteChatVoiceMessageDialog
        open={Boolean(deleteVoiceTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteVoiceTarget(null);
        }}
        projectId={String(projectId)}
        messageId={deleteVoiceTarget?.messageId ?? ""}
        durationMs={deleteVoiceTarget?.durationMs ?? null}
        hasMessageText={Boolean(deleteVoiceTarget?.hasMessageText)}
        onDeleted={(result) => {
          if (result.deletedEntireMessage) {
            removeMessage(result.messageId);
          } else if (result.message) {
            replaceMessage(result.messageId, result.message);
          }
          setDeleteVoiceTarget(null);
        }}
      />

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="relative z-10 flex h-full min-h-0 flex-col overflow-y-auto p-3 backdrop-blur-sm sm:p-4"
        >
          {!conversationId ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              Loading chat…
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="mt-auto flex w-full flex-col justify-end">
              {sortedMessages.map((message, index) => {
                const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
                const showHeader = !prevMessage || prevMessage.user.name !== message.user.name;
                const isOwnMessage = currentUserId ? message.authorId === currentUserId : false;

                return (
                  <div
                    key={message.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                  >
                    <ChatMessageItem
                      message={message}
                      isOwnMessage={isOwnMessage}
                      showHeader={showHeader}
                      avatar={avatarFor(message, isOwnMessage)}
                      projectLogo={
                        !isOwnMessage && userRole === "freelancer" ? projectLogo : null
                      }
                      projectId={projectId}
                      currentUserId={currentUserId}
                      canModerateVoice={canModerateVoice}
                      onRequestDeleteVoice={setDeleteVoiceTarget}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSend(e)}
        className="relative z-20 flex w-full flex-col gap-2 border-t border-border bg-white/80 p-3 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      >
        {voiceComposer.panelVisible ? voiceComposer.panel : null}
        <div className="flex w-full items-center gap-2">
          {!isDemoChat && !pendingVoice && !voiceComposer.recording ? (
            voiceComposer.micButton
          ) : (
            <span className="h-9 w-9 shrink-0" aria-hidden />
          )}
          <div className="relative min-w-0 flex-1">
            <ChatLibraryMentionPicker
              open={Boolean(mentionState) && !isDemoChat && !inputDisabled}
              loading={libraryLoading && libraryItems.length === 0}
              items={filteredMentions}
              activeIndex={mentionIndex}
              onActiveIndexChange={setMentionIndex}
              onSelect={insertMention}
              query={mentionState?.query || ""}
            />
            <ChatMentionInput
              ref={mentionInputRef}
              value={newMessage}
              onValueChange={setNewMessage}
              onMentionQueryChange={syncMentionFromInput}
              disabled={inputDisabled || isDemoChat}
              placeholder={
                isDemoChat
                  ? "Demo chat — text only"
                  : inputDisabled
                    ? "Connecting…"
                    : "Message · type @ for files & links"
              }
              onKeyDown={(e) => {
                if (mentionState && !isDemoChat && !inputDisabled) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (filteredMentions.length === 0) return;
                    setMentionIndex((i) => (i + 1) % filteredMentions.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (filteredMentions.length === 0) return;
                    setMentionIndex(
                      (i) =>
                        (i - 1 + filteredMentions.length) % filteredMentions.length
                    );
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setMentionState(null);
                    return;
                  }
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    filteredMentions[mentionIndex]
                  ) {
                    e.preventDefault();
                    insertMention(filteredMentions[mentionIndex]);
                    return;
                  }
                }

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void handleSend(e);
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            type="submit"
            disabled={!showSendButton}
            aria-hidden={!showSendButton}
            className={cn(
              "h-9 w-9 shrink-0 rounded-full p-0 transition-[opacity,transform] duration-200 ease-out",
              showSendButton
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            )}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
