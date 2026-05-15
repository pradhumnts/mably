"use client";

import { cn } from "@/lib/utils";

/** Reserved height for recording / preview strip (px). */
export const VOICE_COMPOSER_PANEL_HEIGHT = 44;

/**
 * Animated slot for voice recording or preview — expands without jumping dialog layout.
 *
 * @param {{ visible: boolean; children: React.ReactNode; className?: string }} props
 */
export function LibraryVoiceComposerPanel({ visible, children, className }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
      aria-hidden={!visible}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "origin-top transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          )}
          style={{ minHeight: visible ? VOICE_COMPOSER_PANEL_HEIGHT : 0 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
