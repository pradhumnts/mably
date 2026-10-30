"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CheckCircle2 } from "lucide-react";
import { ActiveProjectsTimeline } from "@/components/freelancer-dashboard/active-projects-timeline";
import { AttentionFeed } from "@/components/freelancer-dashboard/attention-feed";
import { DashboardHero } from "@/components/freelancer-dashboard/dashboard-hero";
import { DemoPreviewBanner } from "@/components/freelancer-dashboard/demo-preview-banner";
import {
  dashboardContentWrapClass,
  dashboardHeaderInnerClass,
  fadeInUpClass,
  stickyPageHeaderClass,
} from "@/lib/ui/page-chrome";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   headline: string;
 *   dateLabel: string;
 *   summary: { activeProjects: number; newMessages: number; dueThisWeek: number };
 *   attention: Array<Record<string, unknown>>;
 *   timeline: Record<string, unknown>;
 *   hasRealProjects: boolean;
 *   isDemoPreview: boolean;
 *   demoProjectHref: string | null;
 *   createProjectBlockReason: "no_subscription" | "starter_limit" | null;
 * }} props
 */
export function DashboardPageClient({
  headline,
  dateLabel,
  summary,
  attention,
  timeline,
  hasRealProjects,
  isDemoPreview,
  demoProjectHref,
  createProjectBlockReason,
}) {
  const createHref =
    createProjectBlockReason === "no_subscription" || createProjectBlockReason === "starter_limit"
      ? "/billing"
      : "/projects/new";

  const showDashboardPanels =
    isDemoPreview ||
    (hasRealProjects && (timeline.hasActive || attention.length > 0));

  return (
    <>
      <header className={stickyPageHeaderClass}>
        <div className={dashboardHeaderInnerClass}>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className={cn(dashboardContentWrapClass, "pb-16")}>
        <div className="w-full space-y-8">
          <div className={fadeInUpClass(100)}>
            <DashboardHero
              dateLabel={dateLabel}
              headline={headline}
              summary={summary}
              createHref={createHref}
              isDemoPreview={isDemoPreview}
            />
          </div>

          {showDashboardPanels ? (
            <div className="space-y-6">
              {isDemoPreview && demoProjectHref ? (
                // <div className={fadeInUpClass(150)}>
                //   <DemoPreviewBanner demoProjectHref={demoProjectHref} />
                // </div>
                null
              ) : null}
              <div
                className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start"
                aria-label={isDemoPreview ? "Example dashboard preview" : undefined}
              >
                <div className={fadeInUpClass(200)}>
                  <ActiveProjectsTimeline timeline={timeline} isDemoPreview={isDemoPreview} />
                </div>
                <div className={fadeInUpClass(300)}>
                  <AttentionFeed attention={attention} isDemoPreview={isDemoPreview} />
                </div>
              </div>
            </div>
          ) : (
            <DashboardAllCaughtUp className={fadeInUpClass(200)} />
          )}
        </div>
      </div>
    </>
  );
}

/**
 * @param {{ className?: string }} props
 */
function DashboardAllCaughtUp({ className }) {
  return (
    <section
      className={cn(
        "flex w-full flex-col items-center justify-center py-20 text-center sm:py-28",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </div>
      <p className="mt-4 text-base font-medium text-foreground">You&apos;re all caught up</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Nothing needs your attention right now. When you have active projects, your timeline and
        follow-ups will show up here.
      </p>
    </section>
  );
}
