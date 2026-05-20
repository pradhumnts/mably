"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getPortalBrandCssProperties,
  getPortalBrandSurfaceStyles,
} from "@/lib/branding/portal-brand-tokens";
import {
  getPortalBrandContrastMeta,
  normalizeHexColor,
} from "@/lib/branding/portal-brand-contrast";

/**
 * Live preview of client-portal branding (buttons, link accent, discussion-style header).
 *
 * @param {{
 *   brandColor: string;
 *   projectLogo?: string;
 *   projectName?: string;
 *   className?: string;
 * }}
 */
export function PortalBrandPreview({
  brandColor,
  projectLogo = "",
  projectName = "Your project",
  className,
}) {
  const normalized = normalizeHexColor(brandColor);
  const brandCss = useMemo(
    () => getPortalBrandCssProperties(brandColor),
    [brandColor]
  );
  const brandSurface = useMemo(
    () => getPortalBrandSurfaceStyles(brandColor),
    [brandColor]
  );
  const contrast = useMemo(
    () => getPortalBrandContrastMeta(brandColor),
    [brandColor]
  );

  const displayName = projectName?.trim() || "Your project";

  return (
    <div
      className={cn(
        "ml-auto w-full max-w-md space-y-2 text-right",
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">
        Client portal preview
      </p>

      <div
        data-portal-brand={brandCss ? "" : undefined}
        style={brandCss ?? undefined}
        className="overflow-hidden rounded-xl border border-border/80 bg-background text-right shadow-sm"
      >
        <div
          className={cn(
            "relative px-4 py-3",
            !brandSurface && "portal-brand-surface"
          )}
          style={brandSurface?.surface}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -left-6 top-0 h-16 w-16 rounded-full blur-xl",
              !brandSurface && "portal-brand-glow"
            )}
            style={brandSurface?.glow}
          />
          <div className="relative flex items-center justify-end gap-2.5">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                File discussion header
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-background/90 p-1">
              {projectLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projectLogo}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" className="pointer-events-none">
              Upload file
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-events-none"
            >
              View library
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-primary">View all files</span>
            <span className="mx-1.5 text-border">·</span>
            Link and button accents use your brand color
          </p>
        </div>
      </div>

      {brandColor?.trim() && !normalized ? (
        <p className="text-xs text-muted-foreground">
          Enter a valid hex color (e.g. #f97316) to preview your brand.
        </p>
      ) : null}

      {contrast.valid && !contrast.passesAa ? (
        <p className="flex items-start justify-end gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <span className="text-right">
            Button text contrast is below 4.5:1 — try a slightly darker or
            lighter shade for readability.
          </span>
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        </p>
      ) : null}

      {contrast.valid && contrast.passesAa && normalized ? (
        <p className="text-xs text-muted-foreground">
          Button text is chosen automatically for contrast (
          {contrast.ratio?.toFixed(1)}:1).
        </p>
      ) : null}
    </div>
  );
}
