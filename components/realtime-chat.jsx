"use client";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useProjectMessages } from "@/hooks/use-project-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const { messages, sendMessage, isConnected } = useProjectMessages({
    projectId,
    conversationId,
    currentUserId,
    initialMessages,
    onRemoteMessage,
    senderDisplayName,
    selfAvatarUrl,
  });

  const [newMessage, setNewMessage] = useState("");

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, scrollToBottom]);

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

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      const text = newMessage.trim();
      if (!text || disabled || !conversationId || !isConnected) return;
      const draft = newMessage;
      setNewMessage("");
      const ok = await sendMessage(text);
      if (!ok) {
        setNewMessage(draft);
      }
    },
    [newMessage, disabled, conversationId, isConnected, sendMessage]
  );

  const canSend = Boolean(conversationId && isConnected && !disabled);

  return (
    <div className="flex min-h-0 h-full w-full flex-col text-foreground antialiased">
      {/* Full-bleed wallpaper under the scroll layer so p-4 gutters show texture, not Card bg or page behind */}
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
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSendMessage(e)}
        className="flex w-full gap-2 border-t bg-white/80 backdrop-blur-sm border-border p-4"
      >
        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300 border-zinc-200",
            canSend && newMessage.trim() ? "w-[calc(100%-48px)]" : "w-full"
          )}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={canSend ? "Message" : "Connecting…"}
          disabled={!canSend}
        />
        {canSend && newMessage.trim() ? (
          <Button
            variant="outline"
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
          >
            <Send className="size-4" />
          </Button>
        ) : null}
      </form>
    </div>
  );
}
