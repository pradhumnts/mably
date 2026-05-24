"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MessageCircle,
  Upload,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DemoPreviewBadge,
  demoPreviewPanelClass,
} from "@/components/freelancer-dashboard/demo-preview-chrome";

const TYPE_META = {
  unread_chat: {
    Icon: MessageCircle,
    label: "Chat",
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  file_revision: {
    Icon: Upload,
    label: "Files",
    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  invoice_overdue: {
    Icon: CreditCard,
    label: "Payment",
    tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  portal_not_opened: {
    Icon: UserRound,
    label: "Invite",
    tone: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  due_soon: {
    Icon: Calendar,
    label: "Deadline",
    tone: "bg-orange-500/10 text-orange-800 dark:text-orange-200",
  },
};

/**
 * @param {{
 *   attention: Array<{
 *     id: string;
 *     type: string;
 *     projectId: string;
 *     projectName: string;
 *     projectLogo: string;
 *     clientName: string;
 *     clientAvatar: string | null;
 *     title: string;
 *     href: string;
 *     isDemo?: boolean;
 *   }>;
 *   isDemoPreview?: boolean;
 * }} props
 */
export function AttentionFeed({ attention, isDemoPreview = false }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        isDemoPreview && demoPreviewPanelClass
      )}
    >
      <div className="border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Priority
          </p>
          {isDemoPreview ? <DemoPreviewBadge /> : null}
        </div>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Needs attention</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {attention.length > 0
            ? `${attention.length} item${attention.length === 1 ? "" : "s"} across your projects`
            : "Nothing urgent right now"}
        </p>
      </div>

      {attention.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
          </div>
          <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
          <p className="max-w-[220px] text-sm text-muted-foreground">
            New messages, revisions, and invoices will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {attention.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.due_soon;
            const ActionIcon = meta.Icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:gap-4 sm:px-5"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      meta.tone
                    )}
                    aria-hidden
                  >
                    <ActionIcon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                        {item.title}
                      </p>
                      <ChevronRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={item.clientAvatar ?? undefined} alt="" />
                        <AvatarFallback className="text-[9px]">
                          {item.clientName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate text-sm text-muted-foreground">
                        {item.projectName}
                        <span className="text-muted-foreground/70"> · </span>
                        {item.clientName}
                      </span>
                      <span
                        className={cn(
                          "ml-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          meta.tone
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
