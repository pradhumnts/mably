"use client";

import { History, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileLogoForKind, inferFileKindFromMime } from "@/lib/library/infer-types";
import { formatStorageShort } from "@/lib/billing/library-storage-policy";
import { formatLibraryDateTime, formatRevisionLabel } from "@/lib/library/file-versions";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   loading?: boolean;
 *   versions: Array<{
 *     id: string;
 *     version_number: number;
 *     original_filename?: string | null;
 *     mime_type?: string | null;
 *     size_bytes?: number | null;
 *     version_note?: string | null;
 *     created_at?: string | null;
 *     is_current?: boolean;
 *   }>;
 *   selectedVersionId: string | null;
 *   onSelect: (versionId: string, versionNumber: number) => void;
 *   overlay?: boolean;
 * }} props
 */
export function LibraryFileRevisionsPanel({
  open,
  onClose,
  loading = false,
  versions,
  selectedVersionId,
  onSelect,
  overlay = false,
}) {
  const panelCard = (
    <div className="flex h-full min-w-[min(320px,100vw)] flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">Revisions</h3>
          {!loading && versions.length ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {versions.length}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 rounded-full"
          aria-label="Close revisions"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <p className="text-sm">Loading revisions…</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {versions.map((version) => {
              const kind = inferFileKindFromMime(
                version.mime_type,
                version.original_filename || undefined
              );
              const logo = fileLogoForKind(kind);
              const versionId = String(version.id);
              const selected =
                selectedVersionId != null
                  ? String(selectedVersionId) === versionId
                  : Boolean(version.is_current);
              const dateTimeLabel = version.created_at
                ? formatLibraryDateTime(version.created_at)
                : "";
              const sizeLabel =
                Number.isFinite(Number(version.size_bytes)) && Number(version.size_bytes) > 0
                  ? formatStorageShort(Number(version.size_bytes))
                  : null;
              const metaParts = [dateTimeLabel, sizeLabel].filter(Boolean);
              const filename = version.original_filename?.trim() || "";
              const title = filename || formatRevisionLabel(version.version_number);

              return (
                <li key={versionId}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full gap-3 rounded-md px-2 py-3 text-left transition-colors",
                      selected ? "bg-muted/50" : "hover:bg-muted/50"
                    )}
                    onClick={() =>
                      onSelect(versionId, Math.max(1, Number(version.version_number) || 1))
                    }
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-white p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-snug text-foreground">
                        {title}
                      </p>
                      {filename || version.is_current ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {filename ? (
                            <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/50">
                              {formatRevisionLabel(version.version_number)}
                            </span>
                          ) : null}
                          {version.is_current ? (
                            <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/50">
                              Current
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {metaParts.length ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {metaParts.join(" · ")}
                        </p>
                      ) : null}
                      {version.version_note ? (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {version.version_note}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <>
        <div
          className={cn(
            "absolute inset-0 z-10 bg-black/15 transition-opacity duration-300 ease-out",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={!open}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 z-20 flex p-1 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "translate-x-0" : "pointer-events-none translate-x-full"
          )}
          aria-hidden={!open}
        >
          <div className="h-full w-[min(340px,92vw)]">{panelCard}</div>
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "w-[min(340px,36vw)] opacity-100" : "pointer-events-none w-0 opacity-0"
      )}
      aria-hidden={!open}
    >
      {panelCard}
    </aside>
  );
}
