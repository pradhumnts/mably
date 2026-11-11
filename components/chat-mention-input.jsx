"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import {
  getActiveMentionFromEditor,
  hydrateLibraryMentionChips,
  insertLibraryMentionChipAtCaret,
  serializeLibraryMentionPlainText,
} from "@/lib/chat/mention-dom";

/**
 * @typedef {{
 *   focus: () => void;
 *   clear: () => void;
 *   setContent: (text: string) => void;
 *   insertMention: (item: { kind: "file" | "link"; id: string; label: string }) => void;
 * }} ChatMentionInputHandle
 */

/**
 * @param {{
 *   value: string;
 *   onValueChange: (value: string) => void;
 *   onMentionQueryChange: (state: { start: number; query: string } | null) => void;
 *   disabled?: boolean;
 *   placeholder?: string;
 *   className?: string;
 *   multiline?: boolean;
 *   onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
 * }} props
 */
export const ChatMentionInput = forwardRef(function ChatMentionInput(
  {
    value,
    onValueChange,
    onMentionQueryChange,
    disabled = false,
    placeholder = "Message",
    className,
    multiline = false,
    onKeyDown,
  },
  ref
) {
  const editorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const skipExternalSync = useRef(false);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const serialized = serializeLibraryMentionPlainText(el);
    skipExternalSync.current = true;
    onValueChange(serialized);
    onMentionQueryChange(getActiveMentionFromEditor(el));
  };

  useEffect(() => {
    if (skipExternalSync.current) {
      skipExternalSync.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    if (!value) {
      el.innerHTML = "";
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus() {
      editorRef.current?.focus();
    },
    clear() {
      const el = editorRef.current;
      if (!el) return;
      el.innerHTML = "";
      skipExternalSync.current = true;
      onValueChange("");
      onMentionQueryChange(null);
    },
    setContent(text) {
      const el = editorRef.current;
      if (!el) return;
      const next = typeof text === "string" ? text : "";
      el.textContent = next;
      hydrateLibraryMentionChips(el);
      skipExternalSync.current = true;
      onValueChange(serializeLibraryMentionPlainText(el));
      onMentionQueryChange(null);
    },
    insertMention(item) {
      const el = editorRef.current;
      if (!el || !item?.id) return;
      insertLibraryMentionChipAtCaret(el, item);
      emit();
    },
  }));

  return (
    <div className="relative min-w-0 w-full flex-1">
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline={multiline}
        aria-label={placeholder}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          "relative min-w-0 w-full overflow-y-auto border border-zinc-200 bg-background px-3 py-2 text-sm shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          multiline
            ? "min-h-[4.5rem] max-h-40 rounded-lg whitespace-pre-wrap"
            : "min-h-9 max-h-36 rounded-lg whitespace-pre-wrap",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
          className
        )}
        onInput={() => emit()}
        onKeyUp={() => {
          const el = editorRef.current;
          if (!el) return;
          onMentionQueryChange(getActiveMentionFromEditor(el));
        }}
        onClick={() => {
          const el = editorRef.current;
          if (!el) return;
          onMentionQueryChange(getActiveMentionFromEditor(el));
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
        }}
      />
      {!value.trim() ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-10 px-3 pt-2 text-sm text-muted-foreground",
            !multiline && "sm:pt-2"
          )}
        >
          {placeholder}
        </span>
      ) : null}
    </div>
  );
});
