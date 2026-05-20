"use client";

import { cn } from "@/lib/utils";
import { usePortalBrandBackgroundStyle } from "@/components/portal-brand";

/**
 * Full-bleed portal wallpaper — Mably webp by default, brand gradient when set.
 *
 * @param {{
 *   variant?: "dashboard" | "chat";
 *   className?: string;
 * }}
 */
export function PortalBrandBackdrop({ variant = "dashboard", className }) {
  const brandBg = usePortalBrandBackgroundStyle(variant);
  const fallbackClass =
    variant === "chat"
      ? "portal-brand-backdrop--chat"
      : "portal-brand-backdrop--dashboard";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        !brandBg && fallbackClass,
        className
      )}
      style={brandBg ?? undefined}
    />
  );
}
