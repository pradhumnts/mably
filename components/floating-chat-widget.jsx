"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RealtimeChat } from "@/components/realtime-chat";
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

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const chatDisabled = Boolean(bootError || !boot?.conversationId);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Keep chat mounted when closed so Realtime + local message state are not lost to the initial bootstrap snapshot. */}
      <Card
        className={cn(
          "mb-4 w-[500px] h-[70vh] shadow-2xl border-[1px] overflow-hidden p-0 gap-0 relative",
          isOpen
            ? "animate-in slide-in-from-bottom-4 duration-300"
            : "hidden pointer-events-none"
        )}
        aria-hidden={!isOpen}
      >
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url(/images/chat-bg.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          <div className="flex items-center justify-between p-4 border-b border-zinc-100 backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                {userRole === "freelancer" ? (
                  <>
                    <Avatar className="h-[48px] w-[48px] border border-white">
                      <AvatarImage src={clientAvatar || undefined} alt={clientName} />
                      <AvatarFallback>{clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-[48px] w-[48px] border border-white">
                      <AvatarImage src={projectLogo || undefined} alt="" />
                      <AvatarFallback>{(projectName || "P").charAt(0)}</AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <Avatar className="h-[48px] w-[48px] border border-white">
                    <AvatarImage src={freelancerAvatar || undefined} alt={freelancerName} />
                    <AvatarFallback>{freelancerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  {userRole === "client" ? freelancerName : clientName}
                </h3>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative z-10 flex h-[calc(70vh-5.3rem)] min-h-0 flex-col">
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
          className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-shadow duration-300 p-0 overflow-hidden border-2 border-white relative"
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
