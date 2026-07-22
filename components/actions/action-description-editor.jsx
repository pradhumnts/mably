"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Bold,
  Code2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChatLibraryMentionPicker } from "@/components/chat-library-mention-picker";
import { useLibraryMentionPicker } from "@/hooks/use-library-mention-picker";
import {
  formatLibraryMentionsAsPlainLabels,
  getActiveMentionFromEditor,
  htmlWithLibraryMentionTokens,
  hydrateLibraryMentionChips,
  insertLibraryMentionChipAtCaret,
} from "@/lib/chat/mention-dom";
import { cn } from "@/lib/utils";

/**
 * @param {string | null | undefined} html
 */
export function stripActionDescriptionHtml(html) {
  const withoutTags = String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return formatLibraryMentionsAsPlainLabels(withoutTags).replace(/\s+/g, " ").trim();
}

/**
 * @param {string} html
 */
function sanitizeDescriptionHtml(html) {
  if (typeof window === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  const allowed = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "S",
    "STRIKE",
    "A",
    "UL",
    "OL",
    "LI",
    "P",
    "BR",
    "CODE",
    "DIV",
  ]);

  const walk = (node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = /** @type {HTMLElement} */ (child);
        if (!allowed.has(el.tagName)) {
          el.replaceWith(...el.childNodes);
          continue;
        }
        if (el.tagName === "A") {
          const href = el.getAttribute("href") || "";
          el.removeAttribute("style");
          [...el.attributes].forEach((attr) => {
            if (attr.name !== "href" && attr.name !== "target" && attr.name !== "rel") {
              el.removeAttribute(attr.name);
            }
          });
          if (!/^https?:\/\//i.test(href) && !href.startsWith("mailto:")) {
            el.replaceWith(...el.childNodes);
            continue;
          }
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        } else {
          [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
        }
        walk(el);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/**
 * @returns {Range | null}
 */
function saveSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange();
}

/**
 * @param {Range | null} range
 */
function restoreSelection(range) {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * @param {{
 *   value: string;
 *   onChange: (html: string) => void;
 *   projectId?: string;
 *   disabled?: boolean;
 *   placeholder?: string;
 *   className?: string;
 * }} props
 */
export function ActionDescriptionEditor({
  value,
  onChange,
  projectId = "",
  disabled = false,
  placeholder = "Optional context · type @ for files & links",
  className,
}) {
  const editorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const savedRange = useRef(/** @type {Range | null} */ (null));
  const lastEmitted = useRef(value || "");
  const labelId = useId();
  const linkInputId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const mentionPicker = useLibraryMentionPicker({
    projectId: String(projectId || ""),
    enabled: Boolean(projectId) && !disabled,
  });

  const {
    pickerOpen,
    pickerLoading,
    filteredMentions,
    mentionIndex,
    setMentionIndex,
    mentionState,
    setMentionState,
    onMentionQueryChange,
    handleMentionKeyDown,
  } = mentionPicker;

  const syncEditorFromValue = useCallback((html) => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = html || "";
    hydrateLibraryMentionChips(el);
  }, []);

  // Hydrate chips when the editor mounts (dialog remounts via key).
  useEffect(() => {
    syncEditorFromValue(value || "");
    lastEmitted.current = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if ((value || "") === lastEmitted.current) return;
    if (document.activeElement === el) return;
    syncEditorFromValue(value || "");
    lastEmitted.current = value || "";
  }, [value, syncEditorFromValue]);

  useEffect(() => {
    if (!linkOpen) return;
    const t = window.setTimeout(() => {
      document.getElementById(linkInputId)?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [linkOpen, linkInputId]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const raw = htmlWithLibraryMentionTokens(el);
    const html = sanitizeDescriptionHtml(raw);
    const plain = stripActionDescriptionHtml(html);
    const next = plain ? html : "";
    lastEmitted.current = next;
    onChange(next);
    onMentionQueryChange(getActiveMentionFromEditor(el));
  }, [onChange, onMentionQueryChange]);

  const insertMention = useCallback(
    (item) => {
      const el = editorRef.current;
      if (!el || !item) return;
      insertLibraryMentionChipAtCaret(el, item);
      setMentionState(null);
      emit();
    },
    [emit, setMentionState]
  );

  /**
   * @param {string} command
   * @param {string} [arg]
   */
  const run = (command, arg) => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const openLinkPopover = () => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    savedRange.current = saveSelection();
    setLinkUrl("");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const trimmed = linkUrl.trim();
    const el = editorRef.current;
    if (!el) return;

    el.focus();
    restoreSelection(savedRange.current);

    if (!trimmed) {
      document.execCommand("unlink");
      emit();
      setLinkOpen(false);
      setLinkUrl("");
      return;
    }

    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const sel = window.getSelection();
    const hasSelection = Boolean(sel && !sel.isCollapsed && sel.toString().trim());

    if (!hasSelection) {
      const label = href.replace(/^https?:\/\//i, "");
      const safeHref = href.replace(/"/g, "&quot;");
      const safeLabel = label
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`
      );
    } else {
      document.execCommand("createLink", false, href);
    }

    emit();
    setLinkOpen(false);
    setLinkUrl("");
  };

  const addCode = () => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    const text = selection?.toString() || "code";
    const safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    document.execCommand("insertHTML", false, `<code>${safe}</code>`);
    emit();
  };

  const empty = !stripActionDescriptionHtml(value);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-background shadow-sm",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 overflow-hidden rounded-t-xl border-b border-border/70 bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          disabled={disabled}
          onClick={() => run("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled}
          onClick={() => run("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          disabled={disabled}
          onClick={() => run("underline")}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          disabled={disabled}
          onClick={() => run("strikeThrough")}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Code" disabled={disabled} onClick={addCode}>
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Bulleted list"
          disabled={disabled}
          onClick={() => run("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={disabled}
          onClick={() => run("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            if (open) {
              openLinkPopover();
              return;
            }
            setLinkOpen(false);
            setLinkUrl("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              aria-label="Link"
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 p-3"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyLink();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor={linkInputId} className="text-xs">
                  Link URL
                </Label>
                <Input
                  id={linkInputId}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinkOpen(false);
                    setLinkUrl("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {linkUrl.trim() ? "Add link" : "Remove link"}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative overflow-visible">
        <ChatLibraryMentionPicker
          open={pickerOpen}
          loading={pickerLoading}
          items={filteredMentions}
          activeIndex={mentionIndex}
          onActiveIndexChange={setMentionIndex}
          onSelect={insertMention}
          query={mentionState?.query || ""}
        />
        {empty ? (
          <p
            className="pointer-events-none absolute left-3 top-3 z-10 text-sm text-muted-foreground"
            id={labelId}
          >
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={empty ? labelId : undefined}
          contentEditable={!disabled}
          suppressContentEditableWarning
          className={cn(
            "min-h-[120px] max-h-[220px] overflow-y-auto rounded-b-xl px-3 py-3 text-sm text-foreground outline-none",
            "[&_a]:text-primary [&_a]:underline",
            "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]"
          )}
          onInput={emit}
          onBlur={emit}
          onClick={() => {
            const el = editorRef.current;
            if (!el) return;
            onMentionQueryChange(getActiveMentionFromEditor(el));
          }}
          onKeyUp={() => {
            const el = editorRef.current;
            if (!el) return;
            onMentionQueryChange(getActiveMentionFromEditor(el));
          }}
          onKeyDown={(e) => {
            if (handleMentionKeyDown(e, insertMention)) {
              return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
              e.preventDefault();
              run("bold");
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
              e.preventDefault();
              run("italic");
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
              e.preventDefault();
              run("underline");
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
              e.preventDefault();
              openLinkPopover();
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * @param {{
 *   label: string;
 *   disabled?: boolean;
 *   onClick: () => void;
 *   children: React.ReactNode;
 * }} props
 */
function ToolbarButton({ label, disabled, onClick, children }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}
