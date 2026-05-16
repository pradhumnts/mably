"use client";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useProjectMessages } from "@/hooks/use-project-messages";
import { useLibraryVoiceComposerState } from "@/components/library-voice-composer";
import { DeleteChatVoiceMessageDialog } from "@/components/delete-chat-voice-message-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isDemoProjectId } from "@/lib/data/demo-project";

const PORTAL_CHAT_WALLPAPER_STYLE = {
  backgroundImage: "url(/images/chat-bg.webp)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export function RealtimeChat({
  projectId,
  conversationId,
  currentUserId,
  initialMessages = [],
  userRole,
  clientAvatar,
  freelancerAvatar,
  senderDisplayName,
  selfAvatarUrl,
  onRemoteMessage,
  disabled = false,
}) {
  const { containerRef, scrollToBottom } = useChatScroll();
  const isDemoChat = isDemoProjectId(String(projectId));

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
      setPendingVoice(null);

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
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={PORTAL_CHAT_WALLPAPER_STYLE}
        />
        <div
          ref={containerRef}
          className="relative z-10 h-full backdrop-blur-sm min-h-0 overflow-y-auto p-4"
        >
          {!conversationId ? (
            <div className="text-center text-sm text-muted-foreground">Loading chat…</div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : null}
          <div>
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
                    projectId={projectId}
                    currentUserId={currentUserId}
                    canModerateVoice={canModerateVoice}
                    onRequestDeleteVoice={setDeleteVoiceTarget}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSend(e)}
        className="flex w-full flex-col gap-2 border-t bg-white/80 backdrop-blur-sm border-border p-4"
      >
        {voiceComposer.panelVisible ? voiceComposer.panel : null}
        <div className="flex w-full items-center gap-2">
          {!isDemoChat && !pendingVoice && !voiceComposer.recording ? (
            voiceComposer.micButton
          ) : (
            <span className="h-9 w-9 shrink-0" aria-hidden />
          )}
          <Input
            className="min-w-0 flex-1 rounded-full border-zinc-200 bg-background text-sm"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              isDemoChat
                ? "Demo chat — text only"
                : inputDisabled
                  ? "Connecting…"
                  : "Message"
            }
            disabled={inputDisabled || isDemoChat}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) void handleSend(e);
              }
            }}
          />
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
