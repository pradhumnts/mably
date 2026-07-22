"use client";

import { FileText, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fileLogoForKind,
  inferFileKindFromMime,
  inferLinkKindFromUrl,
  linkLogoForKind,
} from "@/lib/library/infer-types";

/**
 * @typedef {{
 *   key: string;
 *   kind: "file" | "link";
 *   id: string;
 *   label: string;
 *   subtitle?: string;
 *   logoSrc?: string | null;
 * }} LibraryMentionItem
 */

/**
 * @param {{
 *   open: boolean;
 *   loading?: boolean;
 *   items: LibraryMentionItem[];
 *   activeIndex: number;
 *   onActiveIndexChange: (index: number) => void;
 *   onSelect: (item: LibraryMentionItem) => void;
 *   query?: string;
 * }} props
 */
export function ChatLibraryMentionPicker({
  open,
  loading = false,
  items,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  query = "",
}) {
  if (!open) return null;

  return (
    <div
      className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-[60] overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5"
      role="listbox"
      aria-label="Mention a file or link"
    >
      <div className="border-b border-border/60 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Files & links
          {query ? (
            <span className="normal-case tracking-normal text-muted-foreground/80">
              {" "}
              · “{query}”
            </span>
          ) : null}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading library…
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          {query.trim()
            ? "No matching files or links"
            : "No files or links in this project yet"}
        </div>
      ) : (
        <ul className="max-h-56 overflow-y-auto py-1">
          {items.map((item, index) => {
            const active = index === activeIndex;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-muted" : "hover:bg-muted/60"
                  )}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(item);
                  }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/80 ring-1 ring-border/50">
                    {item.logoSrc ? (
                      <img
                        src={item.logoSrc}
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                    ) : item.kind === "link" ? (
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.kind === "link" ? "Link" : "File"}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * @param {any[]} files
 * @param {any[]} links
 * @returns {LibraryMentionItem[]}
 */
export function buildLibraryMentionItems(files, links) {
  /** @type {LibraryMentionItem[]} */
  const items = [];

  for (const row of files || []) {
    const id = String(row?.id || "");
    if (!id) continue;
    const label =
      String(row.display_name || row.original_filename || "Untitled").trim() ||
      "Untitled";
    const kind = inferFileKindFromMime(row.mime_type, row.original_filename || label);
    items.push({
      key: `file:${id}`,
      kind: "file",
      id,
      label,
      subtitle: row.original_filename && row.original_filename !== label
        ? String(row.original_filename)
        : undefined,
      logoSrc: fileLogoForKind(kind),
    });
  }

  for (const row of links || []) {
    const id = String(row?.id || "");
    if (!id) continue;
    const label = String(row.title || "Untitled link").trim() || "Untitled link";
    const url = String(row.url || "");
    const linkKind = inferLinkKindFromUrl(url);
    let host = "";
    try {
      host = new URL(
        url.startsWith("http") ? url : `https://${url}`
      ).hostname.replace(/^www\./, "");
    } catch {
      host = "";
    }
    items.push({
      key: `link:${id}`,
      kind: "link",
      id,
      label,
      subtitle: host || undefined,
      logoSrc: linkLogoForKind(linkKind),
    });
  }

  return items;
}

/**
 * @param {LibraryMentionItem[]} items
 * @param {string} query
 * @param {number} [limit]
 */
export function filterLibraryMentionItems(items, query, limit = 8) {
  const q = String(query || "").trim().toLowerCase();
  const filtered = !q
    ? items
    : items.filter((item) => {
        const hay = `${item.label} ${item.subtitle || ""}`.toLowerCase();
        return hay.includes(q);
      });
  return filtered.slice(0, limit);
}
