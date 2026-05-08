"use client";

import Link from "next/link";
import {
  Calendar,
  FolderOpen,
  MessageSquareText,
  Receipt,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DescriptionClamp } from "@/components/description-clamp";

export function ActivityFeedSkeleton() {
  return (
    <Card className="p-6 mb-6 gap-[16px]">
      <div className="space-y-3">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-4/5 max-w-lg" />
        <div className="flex items-center gap-3 pt-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="border-t border-zinc-200 mb-4" />
        <div className="relative pl-1">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-zinc-200" />
          <div className="space-y-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 relative">
                <Skeleton className="h-10 w-10 rounded-full shrink-0 relative z-10" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {i === 1 ? (
                    <Skeleton className="h-16 w-full max-w-lg rounded-lg" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ActivitySidebarSkeleton() {
  return (
    <Card className="gap-4 p-6 sticky top-[88px]">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 max-w-[220px]" />
        <div className="border-t pt-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </Card>
  );
}

function filterLabel(key) {
  const m = {
    all: "All",
    files: "Files",
    comments: "Comments",
    approvals: "Approvals",
    payments: "Payments",
  };
  return m[key] || String(key);
}

const hintClass =
  "flex gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-3 text-left transition-colors hover:bg-muted/50";

function HintRow({ icon: Icon, title, children }) {
  return (
    <div className={hintClass}>
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{children}</p>
      </div>
    </div>
  );
}

/**
 * Rich empty state when the feed has no events yet — mirrors the timeline card
 * so the page feels structured, not blank.
 */
export function ActivityEmptyFeedCard({ project, projectId }) {
  const title = project?.title?.trim() || "Project";
  const description =
    project?.description?.trim() ||
    "When your team shares files, leaves comments, or sends invoices, a clear history will appear here.";
  const status = project?.status || "In progress";
  const dueDate = project?.dueDate || "—";

  return (
    <Card className="p-6 mb-6 gap-[16px] overflow-hidden">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        <DescriptionClamp
          text={description}
          className="text-sm text-muted-foreground mb-4"
        />
        <div className="flex flex-wrap items-center gap-3 text-sm mt-[16px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {status}
          </div>
          <span className="mx-0.5 h-4 border-l border-zinc-300 hidden sm:block" />
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Due {dueDate}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Activity Log</h3>
        <div className="border-t border-zinc-200 mb-4" />

        <div
          className={cn(
            "relative rounded-xl border border-dashed border-muted-foreground/25",
            "bg-gradient-to-b from-muted/30 via-muted/15 to-transparent",
            "px-4 py-8 sm:px-6 sm:py-10"
          )}
        >
          <div className="mx-auto max-w-lg text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Your timeline is ready</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nothing has been logged yet. The entries below are the kinds of updates that will show
              up automatically—no extra work required.
            </p>
          </div>

          <div className="mx-auto max-w-md space-y-2.5 mb-8">
            <HintRow icon={FolderOpen} title="Library files & links">
              Uploads and shared links appear with optional approval status.
            </HintRow>
            <HintRow icon={MessageSquareText} title="File thread comments">
              Each comment is grouped with the file name so context stays obvious.
            </HintRow>
            <HintRow icon={Receipt} title="Invoices">
              New invoices from Payments show with amount and reference.
            </HintRow>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
            <Button asChild variant="default" size="sm" className="sm:min-w-[140px]">
              <Link href={`/project/${projectId}/library/files`}>Open library</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="sm:min-w-[140px]">
              <Link href={`/project/${projectId}/payments`}>View payments</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Empty state when filters or search hide all rows — keeps the same card frame when possible.
 */
export function ActivityEmptyFilteredCard({
  project,
  projectId,
  searchQuery,
  activeFilter,
  onClear,
}) {
  const title = project?.title?.trim() || "Project";
  const description = project?.description?.trim() || "";
  const status = project?.status || "In progress";
  const dueDate = project?.dueDate || "—";

  return (
    <Card className="p-6 mb-6 gap-[16px]">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        {description ? (
          <DescriptionClamp
            text={description}
            className="text-sm text-muted-foreground mb-4"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {status}
          </div>
          <span className="mx-0.5 h-4 border-l border-zinc-300 hidden sm:block" />
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Due {dueDate}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Activity Log</h3>
        <div className="border-t border-zinc-200 mb-4" />

        <div className="rounded-xl border border-border/80 bg-muted/20 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm border border-border/60">
            <SearchX className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-2">No matching activity</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            {searchQuery ? (
              <>
                Nothing in this feed matches <span className="font-medium text-foreground">&quot;{searchQuery}&quot;</span>
                {activeFilter !== "all" ? (
                  <>
                    {" "}
                    in the{" "}
                    <span className="font-medium text-foreground">{filterLabel(activeFilter)}</span>{" "}
                    filter.
                  </>
                ) : (
                  "."
                )}
              </>
            ) : (
              <>
                There are no items in the{" "}
                <span className="font-medium text-foreground">{filterLabel(activeFilter)}</span>{" "}
                category yet.
                Try another filter or check back after new updates.
              </>
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button variant="default" size="sm" onClick={onClear}>
              Clear search & filters
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/project/${projectId}/library/files`}>Browse library</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
