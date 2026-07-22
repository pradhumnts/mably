"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RealtimeChat } from "@/components/realtime-chat";
import { PortalBrandBackdrop } from "@/components/portal-brand-backdrop";
import { cn } from "@/lib/utils";
import { getProjectChatBootstrap, markProjectChatRead } from "@/lib/actions/project-chat";
import { toast } from "sonner";

/**
 * @param {{
 *   projectId: string;
 *   userRole: "client" | "freelancer";
 *   portalChatPersonas: {
 *     projectName?: string;
 *     projectLogo?: string | null;
 *     clientName?: string;
 *     clientAvatar?: string | null;
 *     freelancerName?: string;
 *     freelancerAvatar?: string | null;
 *   };
 * }}
 */
export function FloatingChatWidget({ projectId, userRole, portalChatPersonas }) {
  const [isOpen, setIsOpen] = useState(false);
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [introPhase, setIntroPhase] = useState("icon");
  const isOpenRef = useRef(false);

  const h = boot?.header;
  const clientAvatar = (h?.clientAvatar ?? portalChatPersonas?.clientAvatar) ?? null;
  const freelancerAvatar = (h?.freelancerAvatar ?? portalChatPersonas?.freelancerAvatar) ?? null;
  const projectLogo = (h?.projectLogo ?? portalChatPersonas?.projectLogo) ?? null;
  const clientName = h?.clientName?.trim() || portalChatPersonas?.clientName || "Client";
  const freelancerName = h?.freelancerName?.trim() || portalChatPersonas?.freelancerName || "Freelancer";
  const projectName = h?.projectName?.trim() || portalChatPersonas?.projectName || "Project";
  const senderDisplayName = userRole === "client" ? clientName : freelancerName;
  const selfAvatarUrl = userRole === "client" ? clientAvatar : freelancerAvatar;

  useEffect(() => {
    const timer = setTimeout(() => setIntroPhase("avatar"), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBoot(null);
    setBootError(null);
    (async () => {
      const r = await getProjectChatBootstrap(String(projectId));
      if (cancelled) return;
      if (!r.ok) {
        setBootError(r.error || "Could not load chat");
        setUnreadCount(0);
        return;
      }
      setBoot(r);
      setUnreadCount(typeof r.unreadCount === "number" ? r.unreadCount : 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const initialMessages = useMemo(() => boot?.messages ?? [], [boot]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const onRemoteMessage = useCallback(() => {
    setUnreadCount((n) => (isOpenRef.current ? n : n + 1));
  }, []);

  // Refetch persisted messages when opening (heals stale snapshot) then mark read.
  useEffect(() => {
    if (!isOpen || !boot?.conversationId) return;
    const cid = String(boot.conversationId);
    let cancelled = false;
    void (async () => {
      const r = await getProjectChatBootstrap(String(projectId));
      if (cancelled || !r.ok) return;
      setBoot(r);
      setUnreadCount(typeof r.unreadCount === "number" ? r.unreadCount : 0);
      const mark = await markProjectChatRead(String(projectId), cid);
      if (cancelled || !mark.ok) return;
      setUnreadCount(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, boot?.conversationId, projectId]);

  const handleOpenChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = () => handleOpenChat();
    window.addEventListener("mably:open-portal-chat", onOpen);
    return () => window.removeEventListener("mably:open-portal-chat", onOpen);
  }, [handleOpenChat]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openChat") !== "1") return;
    if (bootError || !boot?.conversationId) return;
    handleOpenChat();
    const url = new URL(window.location.href);
    url.searchParams.delete("openChat");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, [bootError, boot?.conversationId, handleOpenChat]);

  const chatDisabled = Boolean(bootError || !boot?.conversationId);

  return (
    <div
      className={cn(
        "fixed z-50",
        isOpen ? "inset-0 md:inset-auto md:bottom-6 md:right-6" : "bottom-4 right-4 md:bottom-6 md:right-6"
      )}
    >
      {/* Keep chat mounted when closed so Realtime + local message state are not lost to the initial bootstrap snapshot. */}
      <Card
        className={cn(
          "relative flex flex-col gap-0 overflow-hidden border p-0 shadow-2xl",
          isOpen
            ? "h-[100dvh] w-full max-md:rounded-none md:mb-4 md:h-[70vh] md:w-[500px] md:rounded-lg animate-in slide-in-from-bottom-4 duration-300"
            : "hidden pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
          <PortalBrandBackdrop variant="chat" />

          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-zinc-100 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex shrink-0 items-center -space-x-2">
                {userRole === "freelancer" ? (
                  <>
                    <Avatar className="h-10 w-10 border border-white sm:h-12 sm:w-12">
                      <AvatarImage src={clientAvatar || undefined} alt={clientName} />
                      <AvatarFallback>{clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 border border-white sm:h-12 sm:w-12">
                      <AvatarImage src={projectLogo || undefined} alt="" />
                      <AvatarFallback>{(projectName || "P").charAt(0)}</AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <Avatar className="h-10 w-10 border border-white sm:h-12 sm:w-12">
                    <AvatarImage src={freelancerAvatar || undefined} alt={freelancerName} />
                    <AvatarFallback>{freelancerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {userRole === "client" ? freelancerName : clientName}
                </h3>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            {bootError ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {bootError}
              </div>
            ) : (
              <RealtimeChat
                projectId={String(projectId)}
                conversationId={boot?.conversationId ?? null}
                currentUserId={boot?.currentUserId ?? null}
                initialMessages={initialMessages}
                userRole={userRole}
                clientAvatar={clientAvatar}
                freelancerAvatar={freelancerAvatar}
                projectLogo={projectLogo}
                senderDisplayName={senderDisplayName}
                selfAvatarUrl={selfAvatarUrl}
                onRemoteMessage={onRemoteMessage}
                disabled={chatDisabled}
              />
            )}
          </div>
        </Card>

      <div
        className={cn(
          "relative animate-in slide-in-from-bottom-4 zoom-in-75 duration-500",
          isOpen && "hidden"
        )}
      >
        <Button
          onClick={() => {
            if (bootError) {
              toast.error(bootError);
              return;
            }
            handleOpenChat();
          }}
          size="icon"
          variant="outline"
          className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white p-0 shadow-xl transition-shadow duration-300 hover:shadow-2xl sm:h-16 sm:w-16"
          type="button"
        >
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-white rounded-full transition-all duration-600",
              introPhase === "avatar" ? "opacity-0 scale-75" : "opacity-100 scale-100"
            )}
          >
            <MessageCircle className="h-9 w-9 text-black" />
          </span>

          <span
            className={cn(
              "absolute inset-0 transition-all duration-600",
              introPhase === "avatar" ? "opacity-100 scale-100" : "opacity-0 scale-110"
            )}
          >
            <Avatar className="h-full w-full">
              <AvatarImage
                src={userRole === "client" ? freelancerAvatar || undefined : clientAvatar || undefined}
                alt={userRole === "client" ? freelancerName : clientName}
              />
              <AvatarFallback>{userRole === "client" ? freelancerName.charAt(0) : clientName.charAt(0)}</AvatarFallback>
            </Avatar>
          </span>
        </Button>

        {unreadCount > 0 && introPhase === "avatar" && !bootError && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 bg-red-500 text-white flex items-center justify-center rounded-full text-xs font-semibold animate-in zoom-in duration-300"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
