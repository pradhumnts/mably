"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FREELANCER_NOTIFICATION_META } from "@/lib/notifications/freelancer-notification-meta";

/**
 * @param {{
 *   type: string;
 *   projectLogo?: string;
 *   clientAvatar?: string | null;
 *   actorAvatar?: string | null;
 *   actorName?: string | null;
 *   projectName?: string;
 *   className?: string;
 * }} props
 */
export function NotificationAvatar({
  type,
  projectLogo,
  clientAvatar,
  actorAvatar,
  actorName,
  projectName,
  className,
}) {
  const meta = FREELANCER_NOTIFICATION_META[type] ?? FREELANCER_NOTIFICATION_META.unread_chat;
  const Icon = meta.Icon;
  const primarySrc = actorAvatar || clientAvatar || projectLogo;
  const fallback = (actorName || projectName || "?").charAt(0).toUpperCase();

  return (
    <div className={cn("relative h-11 w-11 shrink-0", className)}>
      <Avatar className="h-11 w-11 border border-border/60">
        <AvatarImage src={primarySrc ?? undefined} alt="" />
        <AvatarFallback className="bg-muted text-sm font-medium">{fallback}</AvatarFallback>
      </Avatar>
      {projectLogo && primarySrc !== projectLogo ? (
        <Avatar className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-2 border-background">
          <AvatarImage src={projectLogo} alt="" />
          <AvatarFallback className="text-[8px]">P</AvatarFallback>
        </Avatar>
      ) : null}
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm"
        aria-hidden
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2} />
      </span>
    </div>
  );
}
