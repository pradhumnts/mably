"use client";

import Link from "next/link";
import { FileText, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  libraryMentionHref,
  parseLibraryMentionSegments,
} from "@/lib/chat/library-mentions";
import { splitTextWithLinks } from "@/components/linkified-text";

/**
 * @param {{
 *   text: string;
 *   projectId?: string;
 *   isOwnMessage?: boolean;
 *   className?: string;
 *   linkify?: boolean;
 * }} props
 */
export function ChatMessageBody({
  text,
  projectId = "",
  isOwnMessage = false,
  className,
  linkify = false,
}) {
  const segments = parseLibraryMentionSegments(text);
  if (segments.length === 0) return null;

  const chipClass = (own) =>
    cn(
      "mx-0.5 inline-flex max-w-[14rem] items-center gap-1 rounded-md px-1.5 py-0.5 align-baseline text-[0.8125rem] font-medium no-underline transition-opacity",
      own
        ? "bg-primary-foreground/18 text-primary-foreground hover:bg-primary-foreground/28"
        : "bg-background/90 text-foreground ring-1 ring-border/70 hover:bg-background"
    );

  /**
   * @param {string} value
   * @param {string} keyPrefix
   */
  const renderText = (value, keyPrefix) => {
    if (!linkify) {
      return <span key={keyPrefix}>{value}</span>;
    }
    const parts = splitTextWithLinks(value);
    if (!parts.length) return <span key={keyPrefix}>{value}</span>;
    return (
      <span key={keyPrefix}>
        {parts.map((part, i) =>
          part.type === "link" && part.href ? (
            <a
              key={`${keyPrefix}-l-${i}`}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2",
                isOwnMessage
                  ? "text-primary-foreground/95"
                  : "text-blue-600 hover:text-blue-800 dark:text-blue-400"
              )}
            >
              {part.value}
            </a>
          ) : (
            <span key={`${keyPrefix}-t-${i}`}>{part.value}</span>
          )
        )}
      </span>
    );
  };

  const hasMentions = segments.some((s) => s.type === "mention");
  if (!hasMentions) {
    if (linkify) {
      return (
        <p className={cn("whitespace-pre-wrap break-words", className)}>
          {renderText(text, "all")}
        </p>
      );
    }
    return (
      <p className={cn("whitespace-pre-wrap break-words", className)}>{text}</p>
    );
  }

  return (
    <p className={cn("whitespace-pre-wrap break-words", className)}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return renderText(segment.value, `t-${index}`);
        }

        const href = libraryMentionHref(projectId, segment.kind, segment.id);
        const Icon = segment.kind === "link" ? Link2 : FileText;

        if (!href) {
          return (
            <span key={`m-${index}`} className={chipClass(isOwnMessage)}>
              <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{segment.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={`m-${index}`}
            href={href}
            className={chipClass(isOwnMessage)}
            title={segment.kind === "link" ? "Open link in library" : "Preview file"}
          >
            <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{segment.label}</span>
          </Link>
        );
      })}
    </p>
  );
}
