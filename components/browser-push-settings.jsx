"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getPushSubscriptionStatus } from "@/lib/actions/push-subscription";
import { useWebPush } from "@/lib/client/use-web-push";

/**
 * Project portal settings — browser push for chat messages.
 */
export function BrowserPushSettings() {
  const { ready, supported, configured, permission, busy, error, enable, syncSubscription } =
    useWebPush();
  const [savedCount, setSavedCount] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);

  const refreshSavedStatus = useCallback(async () => {
    setStatusLoading(true);
    const r = await getPushSubscriptionStatus();
    if (r.ok) setSavedCount(r.count ?? 0);
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    if (!ready || permission !== "granted") {
      setStatusLoading(false);
      return;
    }
    void refreshSavedStatus();
  }, [ready, permission, refreshSavedStatus]);

  const handleResync = async () => {
    const r = await syncSubscription();
    await refreshSavedStatus();
    if (r?.ok) {
      toast.success("Subscription synced");
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-between gap-4 opacity-60">
        <div className="space-y-0.5">
          <Label>Browser notifications</Label>
          <p className="text-sm text-muted-foreground">Checking support…</p>
        </div>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden />
            Browser notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Your browser does not support push notifications. Try Chrome or Edge on desktop.
          </p>
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label>Browser notifications</Label>
          <p className="text-sm text-muted-foreground">
            Push is not configured on this server yet (VAPID keys missing). Add them to your
            environment and restart the app.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "granted") {
    const hasSavedSub = savedCount > 0;
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" aria-hidden />
              Browser notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              You will get alerts for messages from someone else in this project — not your own.
            </p>
            {!statusLoading && !hasSavedSub ? (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Subscription not saved yet — tap Re-sync below.
              </p>
            ) : null}
          </div>
          <span className="shrink-0 self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            On
          </span>
        </div>
        {!hasSavedSub ? (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void handleResync()}>
            Re-sync
          </Button>
        ) : null}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <Label className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden />
            Browser notifications
          </Label>
          <p className="text-sm text-muted-foreground">
            Blocked in your browser. Open site settings for this URL and allow Notifications, then
            reload this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enable-browser-push">Browser notifications</Label>
          <p className="text-sm text-muted-foreground">
            Get new chat messages when Mably is closed. Clicking a notification opens chat.
          </p>
        </div>
        <Button
          id="enable-browser-push"
          type="button"
          size="sm"
          className="shrink-0"
          disabled={busy}
          onClick={() => void enable()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Enabling…
            </>
          ) : (
            "Enable"
          )}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
