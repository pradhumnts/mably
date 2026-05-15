"use client";

import { MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown where a voice note player was after the recording was deleted.
 */
export function LibraryVoiceMessageDeleted({ className }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
      role="status"
    >
      <MicOff className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      Voice message deleted
    </p>
  );
}
