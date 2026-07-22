"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { libraryMentionHref } from "@/lib/chat/library-mentions";
import { stripActionDescriptionHtml } from "@/components/actions/action-description-editor";
import { cn } from "@/lib/utils";

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} html
 * @param {string} projectId
 */
function htmlWithClickableMentions(html, projectId) {
  return String(html || "").replace(
    /@\[(file|link):([^\]|]+)\|([^\]]*)\]/g,
    (_, kind, id, label) => {
      const href = libraryMentionHref(
        projectId,
        kind === "link" ? "link" : "file",
        id
      );
      const safeLabel = escapeHtml(String(label || "").trim() || (kind === "link" ? "Link" : "File"));
      if (!href) {
        return `<span class="action-mention-chip">${safeLabel}</span>`;
      }
      return `<a href="${escapeHtml(href)}" class="action-mention-chip" data-mably-mention="${kind === "link" ? "link" : "file"}">${safeLabel}</a>`;
    }
  );
}

/**
 * Read-only sanitize: keep formatting + http(s)/mailto + in-app /project mention links.
 * @param {string} html
 */
function sanitizeViewHtml(html) {
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
    "SPAN",
  ]);

  const walk = (node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (child);
      if (!allowed.has(el.tagName)) {
        el.replaceWith(...el.childNodes);
        continue;
      }

      if (el.tagName === "A") {
        const href = el.getAttribute("href") || "";
        const isMention = el.getAttribute("data-mably-mention");
        const isExternal =
          /^https?:\/\//i.test(href) || href.startsWith("mailto:");
        const isProjectPath = href.startsWith("/project/");

        [...el.attributes].forEach((attr) => {
          if (
            attr.name !== "href" &&
            attr.name !== "target" &&
            attr.name !== "rel" &&
            attr.name !== "class" &&
            attr.name !== "data-mably-mention"
          ) {
            el.removeAttribute(attr.name);
          }
        });

        if (isMention && isProjectPath) {
          el.setAttribute("class", "action-mention-chip");
          el.removeAttribute("target");
          el.removeAttribute("rel");
        } else if (isExternal) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
          if (!el.className) el.removeAttribute("class");
        } else {
          el.replaceWith(...el.childNodes);
          continue;
        }
      } else if (el.tagName === "SPAN" && el.classList.contains("action-mention-chip")) {
        [...el.attributes].forEach((attr) => {
          if (attr.name !== "class") el.removeAttribute(attr.name);
        });
      } else {
        [...el.attributes].forEach((attr) => el.removeAttribute(attr.name));
      }

      walk(el);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/**
 * @param {{
 *   html?: string | null;
 *   projectId: string;
 *   className?: string;
 *   emptyLabel?: string;
 * }} props
 */
export function ActionDescriptionView({
  html,
  projectId,
  className,
  emptyLabel = "No description",
}) {
  const router = useRouter();
  const plain = stripActionDescriptionHtml(html);
  const content = useMemo(() => {
    if (!plain) return "";
    return sanitizeViewHtml(htmlWithClickableMentions(html || "", projectId));
  }, [html, projectId, plain]);

  if (!plain) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>
    );
  }

  return (
    <div
      className={cn(
        "action-description-view text-sm text-foreground",
        "[&_a:not(.action-mention-chip)]:text-primary [&_a:not(.action-mention-chip)]:underline",
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_.action-mention-chip]:mx-0.5 [&_.action-mention-chip]:inline-flex [&_.action-mention-chip]:max-w-[14rem] [&_.action-mention-chip]:items-center [&_.action-mention-chip]:truncate [&_.action-mention-chip]:rounded-md [&_.action-mention-chip]:bg-muted [&_.action-mention-chip]:px-1.5 [&_.action-mention-chip]:py-0.5 [&_.action-mention-chip]:align-baseline [&_.action-mention-chip]:text-[0.8125rem] [&_.action-mention-chip]:font-medium [&_.action-mention-chip]:text-foreground [&_.action-mention-chip]:no-underline [&_.action-mention-chip]:ring-1 [&_.action-mention-chip]:ring-border/70 [&_.action-mention-chip]:hover:bg-muted/80",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
      onClick={(e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        const anchor = target.closest?.("a[data-mably-mention]");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href?.startsWith("/project/")) return;
        e.preventDefault();
        router.push(href);
      }}
    />
  );
}
