"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationAvatar } from "@/components/notifications/notification-avatar";

/**
 * @param {{
 *   notifications: Array<Record<string, unknown>>;
 *   onDismiss: (entry: { id: string; type?: string; projectId?: string }) => void | Promise<void>;
 *   onNavigate?: () => void;
 *   emptyMessage?: string;
 * }} props
 */
export function NotificationsList({
  notifications,
  onDismiss,
  onNavigate,
  emptyMessage = "You're all caught up",
}) {
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Messages, file updates, payments, and portal activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50">
      {notifications.map((item) => {
        const id = String(item.id);
        const type = String(item.type);
        const projectId = item.projectId ? String(item.projectId) : undefined;
        const isRead = Boolean(item.readAt);
        const createdAt = item.createdAt ? new Date(String(item.createdAt)) : new Date();
        const timeLabel = Number.isNaN(createdAt.getTime())
          ? ""
          : formatDistanceToNow(createdAt, { addSuffix: true });
        const href = String(item.href || "#");

        const handleOpen = () => {
          if (!isRead) void onDismiss({ id, type, projectId });
          onNavigate?.();
        };

        return (
          <li key={id}>
            <Link
              href={href}
              onClick={handleOpen}
              prefetch={false}
              className={cn(
                "group flex gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-5",
                !isRead && "bg-primary/[0.02]"
              )}
            >
              <NotificationAvatar
                type={type}
                projectLogo={item.projectLogo ? String(item.projectLogo) : undefined}
                clientAvatar={item.clientAvatar ? String(item.clientAvatar) : null}
                actorAvatar={item.actorAvatar ? String(item.actorAvatar) : null}
                actorName={item.actorName ? String(item.actorName) : null}
                projectName={item.projectName ? String(item.projectName) : undefined}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold text-foreground",
                        isRead && "font-medium text-muted-foreground"
                      )}
                    >
                      {item.actorName ? String(item.actorName) : "Update"}
                      {timeLabel ? (
                        <span className="font-normal text-muted-foreground"> · {timeLabel}</span>
                      ) : null}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm leading-snug",
                        isRead
                          ? "text-muted-foreground"
                          : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    {!isRead ? (
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        aria-label="Unread"
                      />
                    ) : null}
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </div>

                {item.body ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/80">{item.projectName}</span>
                    <span className="text-muted-foreground/70"> — </span>
                    {String(item.body)}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
