"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarRange } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DemoPreviewBadge,
  demoPreviewPanelClass,
} from "@/components/freelancer-dashboard/demo-preview-chrome";

/**
 * @param {{
 *   timeline: {
 *     hasActive: boolean;
 *     activeCount: number;
 *     rangeStartLabel: string;
 *     rangeEndLabel: string;
 *     todayPercent: number;
 *     overlapSummary: string | null;
 *     projects: Array<{
 *       id: string;
 *       name: string;
 *       logo: string;
 *       clientName: string;
 *       clientAvatar: string | null;
 *       href: string;
 *       settingsHref: string;
 *       startLabel: string;
 *       endLabel: string;
 *       barLeft: number;
 *       barWidth: number;
 *       isOverlapping: boolean;
 *       daysRemaining: number | null;
 *     }>;
 *     undated: Array<{
 *       id: string;
 *       name: string;
 *       logo: string;
 *       clientName: string;
 *       clientAvatar: string | null;
 *       href: string;
 *       settingsHref: string;
 *     }>;
 *   };
 *   isDemoPreview?: boolean;
 * }} props
 */
export function ActiveProjectsTimeline({ timeline, isDemoPreview = false }) {
  if (!timeline.hasActive) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
        <CalendarRange className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 text-sm font-medium text-foreground">No active projects</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Active work with start and end dates will appear on your timeline.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        isDemoPreview && demoPreviewPanelClass
      )}
    >
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Active projects
              </p>
              {isDemoPreview ? <DemoPreviewBadge /> : null}
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Timeline overview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {timeline.activeCount} active · {timeline.rangeStartLabel} – {timeline.rangeEndLabel}
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            All projects
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {timeline.overlapSummary ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <p className="text-sm leading-snug text-amber-950/90 dark:text-amber-100/90">
              {timeline.overlapSummary}
            </p>
          </div>
        ) : null}
      </div>

      <div className="px-6 pb-2 pt-5">
        <div className="relative mb-1 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{timeline.rangeStartLabel}</span>
          <span>{timeline.rangeEndLabel}</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted/60">
          <div
            className="absolute top-0 z-10 h-full w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
            style={{ left: `${timeline.todayPercent}%` }}
            title="Today"
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Today
        </p>
      </div>

      <div className="space-y-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
        {timeline.projects.map((project) => (
          <Link
            key={project.id}
            href={project.href}
            className="group block rounded-xl px-2 py-3 transition-colors hover:bg-muted/35 sm:px-3"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <ProjectMark logo={project.logo} name={project.name} clientAvatar={project.clientAvatar} clientName={project.clientName} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {project.name}
                  </span>
                  {project.isOverlapping ? (
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                      Overlap
                    </span>
                  ) : null}
                  {!isDemoPreview && project.daysRemaining !== null && project.daysRemaining <= 7 ? (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {project.daysRemaining === 0
                        ? "Due today"
                        : `${project.daysRemaining}d left`}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {project.clientName} · {project.startLabel} → {project.endLabel}
                </p>
                <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn(
                      "absolute top-0 h-full rounded-full transition-all",
                      project.isOverlapping
                        ? "bg-gradient-to-r from-amber-500/90 to-orange-500/90"
                        : "bg-gradient-to-r from-primary/80 to-primary"
                    )}
                    style={{
                      left: `${project.barLeft}%`,
                      width: `${project.barWidth}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}

        {timeline.undated.length > 0 ? (
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Missing dates
            </p>
            <ul className="space-y-2">
              {timeline.undated.map((project) => (
                <li key={project.id}>
                  <Link
                    href={project.settingsHref}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 px-3 py-3 transition-colors hover:bg-muted/30"
                  >
                    <ProjectMark
                      logo={project.logo}
                      name={project.name}
                      clientAvatar={project.clientAvatar}
                      clientName={project.clientName}
                      compact
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Add start & end dates in project settings
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {{ logo: string; name: string; clientAvatar: string | null; clientName: string; compact?: boolean }} props
 */
function ProjectMark({ logo, name, clientAvatar, clientName, compact = false }) {
  return (
    <div className={cn("relative shrink-0", compact ? "h-10 w-14" : "h-12 w-14 sm:h-[52px] sm:w-[52px]")}>
      <Avatar
        className={cn(
          "border-2 border-background shadow-sm",
          compact ? "h-10 w-10" : "h-11 w-11 sm:h-12 sm:w-12"
        )}
      >
        <AvatarImage src={logo} alt="" className="object-cover" />
        <AvatarFallback className="bg-muted text-sm font-semibold">
          {(name || "?").charAt(0)}
        </AvatarFallback>
      </Avatar>
      <Avatar
        className={cn(
          "absolute -bottom-0.5 -right-0.5 border-2 border-card shadow-sm",
          compact ? "h-5 w-5" : "h-5 w-5 sm:h-6 sm:w-6"
        )}
      >
        <AvatarImage src={clientAvatar ?? undefined} alt="" />
        <AvatarFallback className="bg-muted text-[9px] font-medium">
          {clientName?.charAt(0) || "C"}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
