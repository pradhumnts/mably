import { cn } from "@/lib/utils";

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/**
 * @param {string} text
 * @returns {Array<{ type: "text" | "link"; value: string; href?: string }>}
 */
export function splitTextWithLinks(text) {
  if (!text) return [];

  /** @type {Array<{ type: "text" | "link"; value: string; href?: string }>} */
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const index = match.index ?? 0;
    if (!raw) continue;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    let href = raw;
    let visible = raw;
    let trailing = "";
    while (href.length && /[.,;:!?)'\]]/.test(href.at(-1) || "")) {
      trailing = href.slice(-1) + trailing;
      href = href.slice(0, -1);
      visible = href;
    }

    if (href) {
      parts.push({ type: "link", value: visible, href });
      if (trailing) parts.push({ type: "text", value: trailing });
    } else {
      parts.push({ type: "text", value: raw });
    }

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * @param {{ text: string; className?: string; linkClassName?: string }} props
 */
export function LinkifiedText({ text, className, linkClassName }) {
  const parts = splitTextWithLinks(text);
  if (!parts.length) return null;

  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.type === "link" && part.href ? (
          <a
            key={`link-${index}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-blue-600 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
              linkClassName
            )}
          >
            {part.value}
          </a>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        )
      )}
    </p>
  );
}
