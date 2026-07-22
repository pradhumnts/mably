import {
  encodeLibraryMention,
  getActiveLibraryMentionQuery,
  parseLibraryMentionSegments,
} from "@/lib/chat/library-mentions";

export const LIBRARY_MENTION_CHIP_CLASS =
  "mention-chip mx-0.5 inline-flex max-w-[12rem] items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 align-baseline text-[0.8125rem] font-medium text-foreground ring-1 ring-border/70";

const FILE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0 opacity-80"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';

const LINK_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0 opacity-80"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

/**
 * @param {"file" | "link"} kind
 * @param {string} id
 * @param {string} label
 */
export function createLibraryMentionChip(kind, id, label) {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.mentionKind = kind === "link" ? "link" : "file";
  chip.dataset.mentionId = id;
  chip.dataset.mentionLabel = label;
  chip.className = LIBRARY_MENTION_CHIP_CLASS;
  chip.setAttribute("data-mention", "true");

  const icon = document.createElement("span");
  icon.className = "inline-flex shrink-0";
  icon.innerHTML = kind === "link" ? LINK_ICON_SVG : FILE_ICON_SVG;
  chip.appendChild(icon);

  const labelEl = document.createElement("span");
  labelEl.className = "truncate";
  labelEl.textContent = label;
  chip.appendChild(labelEl);

  return chip;
}

/**
 * @param {HTMLElement} root
 */
export function serializeLibraryMentionPlainText(root) {
  let out = "";

  /** @param {Node} node */
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent || "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = /** @type {HTMLElement} */ (node);
    if (el.dataset?.mentionKind && el.dataset?.mentionId) {
      out += encodeLibraryMention(
        el.dataset.mentionKind === "link" ? "link" : "file",
        el.dataset.mentionId,
        el.dataset.mentionLabel || ""
      );
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    for (const child of el.childNodes) walk(child);
  };

  for (const child of root.childNodes) walk(child);
  return out;
}

/**
 * Plain text before caret; mention chips count as a space.
 * @param {HTMLElement} root
 */
export function plainTextBeforeCaretWithMentions(root) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    const full = serializeLibraryMentionPlainText(root);
    return { text: full, caret: full.length };
  }

  const range = sel.getRangeAt(0);
  if (!root.contains(range.endContainer)) {
    const full = serializeLibraryMentionPlainText(root);
    return { text: full, caret: full.length };
  }

  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);

  let text = "";
  /** @param {Node} node */
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = /** @type {HTMLElement} */ (node);
    if (el.dataset?.mentionKind) {
      text += " ";
      return;
    }
    if (el.tagName === "BR") {
      text += "\n";
      return;
    }
    for (const child of el.childNodes) walk(child);
  };

  const frag = pre.cloneContents();
  for (const child of frag.childNodes) walk(child);
  return { text, caret: text.length };
}

/**
 * @param {HTMLElement} root
 */
export function getActiveMentionFromEditor(root) {
  const { text, caret } = plainTextBeforeCaretWithMentions(root);
  return getActiveLibraryMentionQuery(text, caret);
}

/**
 * Remove trailing @query from the text node at the caret.
 */
export function deleteActiveMentionQueryInSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
  const node = sel.focusNode;
  const offset = sel.focusOffset;
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;

  const text = node.textContent || "";
  const before = text.slice(0, offset);
  const match = before.match(/(^|[\s])@([^\s[\]]*)$/);
  if (!match) return false;

  const atStart = before.length - match[2].length - 1;
  /** @type {Text} */ (node).deleteData(atStart, offset - atStart);

  const range = document.createRange();
  range.setStart(node, atStart);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

/**
 * Insert a mention chip at the current selection (replacing @query when present).
 * @param {HTMLElement} root
 * @param {{ kind: "file" | "link"; id: string; label: string }} item
 */
export function insertLibraryMentionChipAtCaret(root, item) {
  if (!root || !item?.id) return;
  root.focus();
  deleteActiveMentionQueryInSelection();

  const sel = window.getSelection();
  if (!sel) return;

  let range;
  if (sel.rangeCount > 0 && root.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    range = sel.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
  }
  range.deleteContents();

  const chip = createLibraryMentionChip(
    item.kind === "link" ? "link" : "file",
    String(item.id),
    String(item.label || "Untitled")
  );
  range.insertNode(chip);

  const space = document.createTextNode(" ");
  chip.after(space);

  range.setStartAfter(space);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Replace `@[file|link:…]` tokens in text nodes with chips.
 * @param {HTMLElement} root
 */
export function hydrateLibraryMentionChips(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  /** @type {Text[]} */
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(/** @type {Text} */ (walker.currentNode));
  }

  for (const textNode of textNodes) {
    if (textNode.parentElement?.dataset?.mentionKind) continue;
    const text = textNode.textContent || "";
    if (!text.includes("@[")) continue;
    const segments = parseLibraryMentionSegments(text);
    if (!segments.some((s) => s.type === "mention")) continue;

    const frag = document.createDocumentFragment();
    for (const seg of segments) {
      if (seg.type === "text") {
        if (seg.value) frag.appendChild(document.createTextNode(seg.value));
      } else {
        frag.appendChild(createLibraryMentionChip(seg.kind, seg.id, seg.label));
      }
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

/**
 * Clone HTML and replace mention chips with plain tokens (for sanitizing/saving).
 * @param {HTMLElement} root
 */
export function htmlWithLibraryMentionTokens(root) {
  const clone = /** @type {HTMLElement} */ (root.cloneNode(true));
  clone.querySelectorAll("[data-mention-kind][data-mention-id]").forEach((chip) => {
    const el = /** @type {HTMLElement} */ (chip);
    const token = encodeLibraryMention(
      el.dataset.mentionKind === "link" ? "link" : "file",
      el.dataset.mentionId || "",
      el.dataset.mentionLabel || ""
    );
    el.replaceWith(document.createTextNode(token));
  });
  return clone.innerHTML;
}

/**
 * @param {string | null | undefined} text
 */
export function formatLibraryMentionsAsPlainLabels(text) {
  return String(text || "").replace(
    /@\[(file|link):([^\]|]+)\|([^\]]*)\]/g,
    (_, _kind, _id, label) => String(label || "").trim() || "attachment"
  );
}
