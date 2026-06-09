"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Inline file name with pencil-to-edit. Saves on Enter or Save.
 *
 * @param {{
 *   name: string;
 *   onSave: (nextName: string) => Promise<{ ok: boolean; error?: string }>;
 *   disabled?: boolean;
 *   titleClassName?: string;
 * }} props
 */
export function LibraryInlineFileName({
  name,
  onSave,
  disabled = false,
  titleClassName,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (!editing) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [editing]);

  const cancel = () => {
    setEditing(false);
    setDraft(name);
    setError(null);
  };

  const commit = async () => {
    if (saving || disabled) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("File name is required");
      return;
    }
    if (trimmed === name) {
      cancel();
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onSave(trimmed);
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Could not rename file");
      return;
    }
    setEditing(false);
    setError(null);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            ref={inputRef}
            value={draft}
            disabled={saving}
            className={cn(
              "h-8 w-auto min-w-[20rem] max-w-[min(240px,55vw)] shrink rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 pb-1 shadow-none",
              "text-lg font-semibold sm:text-xl",
              "focus-visible:border-x-0 focus-visible:border-t-0 focus-visible:border-b focus-visible:border-foreground/45 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            aria-label="File name"
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void commit();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-muted-foreground hover:text-foreground"
            disabled={saving}
            onClick={() => void commit()}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className={cn(
          "min-w-0 truncate font-semibold leading-snug",
          titleClassName ?? "text-lg sm:text-xl"
        )}
      >
        {name}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Rename file"
        disabled={disabled}
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
