"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProjectActivityTimeline } from "@/components/project-activity-timeline";
import { ProjectDetailsSidebar } from "@/components/project-details-sidebar";
import {
  ActivityEmptyFeedCard,
  ActivityEmptyFilteredCard,
  ActivityFeedSkeleton,
  ActivitySidebarSkeleton,
} from "@/components/activity-feed-states";
import { getProjectActivityPageData } from "@/lib/actions/project-activity";
import { toast } from "sonner";
import {
  stickyPageHeaderClass,
  stickyPageHeaderInnerClass,
  pageContentWrapClass,
  activityToolbarClass,
  activityFilterRowClass,
} from "@/lib/ui/page-chrome";

function filterActivities(activities, activeFilter, searchQuery) {
  let filtered = activities;

  if (activeFilter !== "all") {
    const filterKey =
      activeFilter === "files"
        ? "files"
        : activeFilter === "comments"
          ? "comments"
          : activeFilter === "approvals"
            ? "approvals"
            : activeFilter === "payments"
              ? "payments"
              : null;
    if (filterKey) {
      filtered = filtered.filter((a) => a.category === filterKey);
    }
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((activity) => {
      const searchableText = [
        activity.action,
        activity.comment,
        activity.fileLink,
        activity.badge?.text,
        activity.timestamp,
        activity.user?.name,
        activity.paymentDetails?.amount,
        activity.paymentDetails?.invoiceNumber,
        activity.eventType,
        activity.destinationLabel,
        activity.externalLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  return filtered;
}

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "files", label: "Files" },
  { key: "comments", label: "Comments" },
  { key: "approvals", label: "Approvals" },
  { key: "payments", label: "Payments" },
];

export default function ProjectActivity() {
  const params = useParams();
  const projectId = params.projectId;
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setLoadError(null);
    const r = await getProjectActivityPageData(String(projectId));
    setLoading(false);
    if (!r.ok) {
      const msg = r.error || "Could not load activity";
      setLoadError(msg);
      toast.error(msg);
      setProject(null);
      setActivities([]);
      return;
    }
    setLoadError(null);
    setProject(r.project);
    setActivities(r.activities);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredActivities = useMemo(
    () => filterActivities(activities, activeFilter, searchQuery),
    [activities, activeFilter, searchQuery]
  );

  const projectType = project?.pricingType === "milestone" ? "milestone" : "one-time";
  const sidebarDetails = project?.sidebar ?? null;

  const timelineProject =
    project &&
    ({
      projectId: String(projectId),
      title: project.title,
      description: project.description,
      status: project.status,
      dueDate: project.dueDate,
      activities: filteredActivities,
    });

  const hasAnyActivities = activities.length > 0;
  const hasFilteredResults = filteredActivities.length > 0;
  const showEmptyFiltered =
    !loading && !loadError && hasAnyActivities && !hasFilteredResults;
  const showEmptyFeed = !loading && !loadError && !hasAnyActivities;

  return (
    <>
      <header className={stickyPageHeaderClass}>
        <div className={stickyPageHeaderInnerClass}>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Activity</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1">
        <div className={pageContentWrapClass}>
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-bold text-foreground sm:mb-2 sm:text-3xl">Activity</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Track what&apos;s done, what&apos;s coming next, and what&apos;s currently in review
            </p>
          </div>

          <div className={activityToolbarClass}>
            <div className={activityFilterRowClass}>
              {FILTER_OPTIONS.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={activeFilter === key ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setActiveFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8">
              {loading ? (
                <ActivityFeedSkeleton />
              ) : loadError ? (
                <Card className="border-dashed p-6 text-center sm:p-10">
                  <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {loadError}
                  </p>
                  <Button variant="default" onClick={() => void load()}>
                    Try again
                  </Button>
                </Card>
              ) : showEmptyFeed ? (
                <ActivityEmptyFeedCard project={project} projectId={String(projectId)} />
              ) : showEmptyFiltered ? (
                <ActivityEmptyFilteredCard
                  project={project}
                  projectId={String(projectId)}
                  searchQuery={searchQuery}
                  activeFilter={activeFilter}
                  onClear={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                />
              ) : timelineProject ? (
                <ProjectActivityTimeline project={timelineProject} />
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-4">
              {loading ? (
                <ActivitySidebarSkeleton />
              ) : (
                <ProjectDetailsSidebar projectType={projectType} projectDetails={sidebarDetails} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
