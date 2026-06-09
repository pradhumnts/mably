"use client";

import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileLogoForKind } from "@/lib/library/infer-types";
import { isLibraryFilePreviewable } from "@/lib/library/file-preview";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   attachedFile: {
 *     id: string;
 *     display_name: string;
 *     type: string;
 *     mime_type?: string | null;
 *   };
 *   onPreview?: () => void;
 *   onDownload?: () => void;
 *   className?: string;
 * }} props
 */
export function LibraryCommentAttachedFile({
  attachedFile,
  onPreview,
  onDownload,
  className,
}) {
  const canPreview = isLibraryFilePreviewable(attachedFile.type, attachedFile.mime_type ?? null);
  const logo = fileLogoForKind(attachedFile.type);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/80 bg-background/90 p-2.5",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-white p-1.5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="h-4 w-4 rounded bg-muted" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{attachedFile.display_name}</p>
        <p className="text-xs text-muted-foreground">Added to project library</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canPreview && onPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            aria-label={`Preview ${attachedFile.display_name}`}
            onClick={onPreview}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ) : null}
        {onDownload ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            aria-label={`Download ${attachedFile.display_name}`}
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
