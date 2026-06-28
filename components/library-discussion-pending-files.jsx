"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileLogoForKind, inferFileKindFromMime } from "@/lib/library/infer-types";
import { formatLibraryVersionLabel } from "@/lib/library/file-versions";
import { cn } from "@/lib/utils";

/** @param {File} file */
function isLocalImageFile(file) {
  if (file.type?.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(file.name || "");
}

/**
 * @param {{
 *   file: File;
 *   previewUrl: string | null;
 *   onRemove: () => void;
 *   disabled?: boolean;
 *   size?: "sm" | "md";
 *   showName?: boolean;
 *   versionHint?: string | null;
 * }} props
 */
function PendingFileThumb({ file, previewUrl, onRemove, disabled, size = "sm", showName, versionHint }) {
  const kind = inferFileKindFromMime(file.type, file.name);
  const logo = fileLogoForKind(kind);
  const dim = size === "md" ? "h-14 w-14" : "h-[52px] w-[52px]";

  const thumb = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted/40",
        dim
      )}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-full w-full object-contain" />
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full border border-border/60 bg-background/95 shadow-sm"
        aria-label={`Remove ${file.name}`}
        disabled={disabled}
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  if (!showName) return thumb;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {thumb}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {versionHint || "Will be added to the library"}
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   files: File[];
 *   onRemove: (index: number) => void;
 *   disabled?: boolean;
 *   nextVersionNumber?: number | null;
 * }} props
 */
export function LibraryDiscussionPendingFiles({ files, onRemove, disabled, nextVersionNumber }) {
  const [previewUrls, setPreviewUrls] = useState(/** @type {string[]} */ ([]));

  const imageFlags = useMemo(() => files.map((file) => isLocalImageFile(file)), [files]);

  useEffect(() => {
    const urls = files.map((file, index) =>
      imageFlags[index] ? URL.createObjectURL(file) : ""
    );
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [files, imageFlags]);

  if (!files.length) return null;

  const multi = files.length > 1;

  if (multi) {
    return (
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <PendingFileThumb
            key={`${file.name}-${file.size}-${index}`}
            file={file}
            previewUrl={previewUrls[index] || null}
            disabled={disabled}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>
    );
  }

  const versionHint =
    nextVersionNumber && nextVersionNumber > 0
      ? `Will be added as ${formatLibraryVersionLabel(nextVersionNumber)}`
      : null;

  return (
    <PendingFileThumb
      file={files[0]}
      previewUrl={previewUrls[0] || null}
      disabled={disabled}
      size="md"
      showName
      versionHint={versionHint}
      onRemove={() => onRemove(0)}
    />
  );
}
