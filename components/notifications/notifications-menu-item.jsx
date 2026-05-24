"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NotificationsPanelContent } from "@/components/notifications/notifications-panel-content";
import { fetchFreelancerNotificationsAction } from "@/lib/actions/freelancer-notifications";
import {
  dismissFreelancerNotificationAction,
  dismissFreelancerNotificationsAction,
  syncLegacyFreelancerNotificationReadsAction,
} from "@/lib/actions/freelancer-notification-reads";
import {
  clearLegacyLocalReadNotificationIds,
  getLegacyLocalReadNotificationIds,
} from "@/lib/client/notification-read-state";
import { cn } from "@/lib/utils";

/** Base panel width 24rem + 20% */
const NOTIFICATIONS_PANEL_WIDTH = "28.8rem";

/**
 * @param {Record<string, unknown>} item
 * @returns {{ id: string; type?: string; projectId?: string }}
 */
function dismissEntryFromItem(item) {
  return {
    id: String(item.id),
    type: item.type ? String(item.type) : undefined,
    projectId: item.projectId ? String(item.projectId) : undefined,
  };
}

/**
 * Sidebar notifications entry — opens a Contra-style flyout beside the nav, not a new route.
 */
export function NotificationsMenuItem() {
  const { state, isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const syncLegacyReads = useCallback(async () => {
    const legacy = [...getLegacyLocalReadNotificationIds()];
    if (legacy.length === 0) return;
    const sync = await syncLegacyFreelancerNotificationReadsAction(legacy);
    if (sync.ok) clearLegacyLocalReadNotificationIds();
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await syncLegacyReads();
      const res = await fetchFreelancerNotificationsAction();
      if (res.ok) setItems(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [syncLegacyReads]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const refresh = () => void loadNotifications();
    const interval = window.setInterval(refresh, 45_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleDismiss = useCallback(
    async (entry) => {
      const res = await dismissFreelancerNotificationAction(entry);
      if (res.ok) void loadNotifications();
    },
    [loadNotifications]
  );

  const handleDismissAll = useCallback(async () => {
    const entries = items.filter((n) => !n.readAt).map(dismissEntryFromItem);
    const res = await dismissFreelancerNotificationsAction(entries);
    if (res.ok) void loadNotifications();
  }, [items, loadNotifications]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

  const panelProps = {
    notifications: items,
    loading,
    onDismiss: handleDismiss,
    onDismissAll: handleDismissAll,
    onClose: () => setOpen(false),
  };

  const badge =
    unreadCount > 0 ? (
      <Badge
        variant="secondary"
        className={cn(
          "ml-auto h-5 min-w-5 shrink-0 justify-center border-0 bg-red-500 px-1.5 text-[10px] font-semibold text-white",
          "dark:bg-red-600",
          state === "collapsed" && "absolute -right-0.5 -top-0.5 ml-0 h-4 min-w-4 px-1"
        )}
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </Badge>
    ) : null;

  const trigger = (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip="Notifications"
        isActive={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(state === "collapsed" && unreadCount > 0 && "relative")}
      >
        <Bell />
        <span>Notifications</span>
        {badge}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-full gap-0 p-0 sm:max-w-[28.8rem]"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Notifications</SheetTitle>
            <NotificationsPanelContent compact {...panelProps} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  const flyoutLeft =
    state === "collapsed"
      ? "var(--sidebar-width-icon, 3rem)"
      : "var(--sidebar-width, 16rem)";

  const panelWidth =
    state === "collapsed"
      ? `min(${NOTIFICATIONS_PANEL_WIDTH}, calc(100vw - var(--sidebar-width-icon, 3rem)))`
      : `min(${NOTIFICATIONS_PANEL_WIDTH}, calc(100vw - var(--sidebar-width, 16rem)))`;

  const flyout =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-[80] bg-black/25 transition-opacity"
              style={{ left: flyoutLeft }}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Notifications"
              aria-modal="true"
              className={cn(
                "fixed inset-y-0 z-[90] flex flex-col border-r border-border/80 bg-background shadow-2xl",
                "animate-in slide-in-from-left-4 fade-in-0 duration-200"
              )}
              style={{
                left: flyoutLeft,
                width: panelWidth,
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 z-10 h-8 w-8 rounded-lg"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
              <NotificationsPanelContent {...panelProps} />
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      {trigger}
      {flyout}
    </>
  );
}
