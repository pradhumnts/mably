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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 my-auto mr-2" />
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

      <div className="flex-1 z-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Activity</h1>
            <p className="text-muted-foreground">
              Track what&apos;s done, what&apos;s coming next, and what&apos;s currently in review
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === "files" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("files")}
                  >
                    Files
                  </Button>
                  <Button
                    variant={activeFilter === "comments" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("comments")}
                  >
                    Comments
                  </Button>
                  <Button
                    variant={activeFilter === "approvals" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("approvals")}
                  >
                    Approvals
                  </Button>
                  <Button
                    variant={activeFilter === "payments" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("payments")}
                  >
                    Payments
                  </Button>
                </div>

                <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {loading ? (
                <ActivityFeedSkeleton />
              ) : loadError ? (
                <Card className="p-8 sm:p-10 text-center border-dashed">
                  <p className="text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
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

            <div className="lg:col-span-4">
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
