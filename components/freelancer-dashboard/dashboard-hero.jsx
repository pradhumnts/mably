"use client";

import Link from "next/link";
import { Briefcase, CalendarClock, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoPreviewNotice } from "@/components/freelancer-dashboard/demo-preview-chrome";

/**
 * @param {{
 *   dateLabel: string;
 *   headline: string;
 *   summary: { activeProjects: number; newMessages: number; dueThisWeek: number };
 *   createHref: string;
 *   isDemoPreview?: boolean;
 * }} props
 */
export function DashboardHero({ dateLabel, headline, summary, createHref, isDemoPreview = false }) {
  const metrics = [
    {
      icon: Briefcase,
      value: summary.activeProjects,
      label: "Active projects",
    },
    {
      icon: MessageCircle,
      value: summary.newMessages,
      label: "New messages",
    },
    {
      icon: CalendarClock,
      value: summary.dueThisWeek,
      label: "Due this week",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{headline}</h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-6">
          <Button asChild variant="outline" size="sm" className="rounded-lg font-medium">
            <Link href="/projects">All projects</Link>
          </Button>
          <Button asChild size="sm" className="gap-1 rounded-lg font-semibold">
            <Link href={createHref}>
              <Plus className="h-4 w-4 stroke-2" aria-hidden />
              Create new project
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        

        {isDemoPreview ? (
          <DemoPreviewNotice>
            <span className="font-medium text-foreground">Preview mode.</span> The stats and cards
            below are <span className="font-medium text-foreground">examples only</span> — not your
            live projects, messages, or deadlines.{" "}
            <Link
              href={createHref}
              className="font-semibold text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline dark:text-orange-300 dark:hover:text-orange-200"
            >
              Create a real project
            </Link>{" "}
            to see your own dashboard.
          </DemoPreviewNotice>
        ) : null}
        <div className="inline-flex max-w-full flex-wrap items-stretch overflow-hidden rounded-full border border-border/80 bg-muted/35">
          {metrics.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-stretch">
                {index > 0 ? <div className="w-px self-stretch bg-border/80" aria-hidden /> : null}
                <div className="flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  <p className="whitespace-nowrap text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.value}</span> {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
