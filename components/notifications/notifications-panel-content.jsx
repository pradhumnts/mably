"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { cn } from "@/lib/utils";

/**
 * @param {Record<string, unknown>} item
 */
function isUnreadItem(item) {
  return !item.readAt;
}

/**
 * @param {{
 *   notifications: Array<Record<string, unknown>>;
 *   loading?: boolean;
 *   compact?: boolean;
 *   onClose?: () => void;
 *   onDismiss: (entry: { id: string; type?: string; projectId?: string }) => void | Promise<void>;
 *   onDismissAll: () => void | Promise<void>;
 * }} props
 */
export function NotificationsPanelContent({
  notifications,
  loading = false,
  compact = false,
  onClose,
  onDismiss,
  onDismissAll,
}) {
  const [filter, setFilter] = useState(/** @type {"all" | "unread"} */ ("unread"));

  const unreadCount = useMemo(
    () => notifications.filter(isUnreadItem).length,
    [notifications]
  );

  const visible = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(isUnreadItem);
    }
    return notifications;
  }, [filter, notifications]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "shrink-0 border-b border-border/60",
          compact ? "px-4 py-4" : "px-5 py-5"
        )}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Notifications</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "You're up to date"}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === "unread"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Unread
              {unreadCount > 0 ? (
                <span className="ml-1 tabular-nums text-muted-foreground">({unreadCount})</span>
              ) : null}
            </button>
          </div>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={onDismissAll}
            >
              Mark all read
            </Button>
          ) : (
            <span className="h-8 w-[5.5rem] shrink-0" aria-hidden />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <NotificationsList
            notifications={visible}
            onDismiss={onDismiss}
            onNavigate={onClose}
            emptyMessage={
              filter === "unread" ? "No unread notifications" : "You're all caught up"
            }
          />
        )}
      </div>
    </div>
  );
}
