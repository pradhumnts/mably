"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebPush } from "@/lib/client/use-web-push";
import { cn } from "@/lib/utils";

/**
 * One-time floating prompt on project portal routes when permission is still "default".
 */
export function WebPushManager({ className }) {
  const { showAutoPrompt, busy, enable, dismissPrompt } = useWebPush();

  if (!showAutoPrompt) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-[60] max-w-xs rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-sm md:bottom-28 md:right-6",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bell className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">Message notifications</p>
          <p className="text-xs leading-snug text-muted-foreground">
            Get new chat messages even when Mably is closed. Tap to open chat.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-8" disabled={busy} onClick={() => void enable()}>
              {busy ? "Enabling…" : "Enable"}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8" disabled={busy} onClick={dismissPrompt}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
