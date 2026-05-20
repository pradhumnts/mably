"use client";

import { Calendar, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProjectDetailsSidebar({ projectType, projectDetails }) {
  if (!projectDetails) {
    return null;
  }

  return (
    <Card className="gap-4 lg:sticky lg:top-[88px]">
      {/* Project Milestones Section - Only for milestone projects */}
      {projectType === "milestone" && projectDetails.milestones && (
        <>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Project Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-[24px]">
        {/* Status */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            {projectDetails.status}
          </span>
          <span className="hidden h-4 border-l border-zinc-300 sm:block" />
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Due {projectDetails.dueDate}
          </span>
        </div>
        <div className="border-t border-zinc-200 my-4" />

        {/* Milestone List */}
        <div className="relative">
          <div className="space-y-[24px]">
            {projectDetails.milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-3 relative">
                {/* Vertical Timeline Line - only show if not the last item */}
                {index < projectDetails.milestones.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-[-16px] w-[1px] bg-zinc-200 z-0" />
                )}
                
                <div className={cn(
                  "mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10",
                  milestone.completed 
                    ? "bg-green-100" 
                    : "bg-gray-200"
                )}>
                  {milestone.completed ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-foreground">
                      {milestone.title}
                    </p>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {milestone.amount}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {milestone.delivery}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

            {/* Divider */}
            {projectType === "milestone" && <div className="border-t" />}
          </CardContent>
        </>
      )}

      {/* Project Details Section - Always show */}
      <CardContent>
        <div>
          <h3 className="text-lg font-semibold mb-4">Project Details</h3>
          
          <div className="space-y-4">
            {/* Timeline */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Timeline</p>
              <p className="text-sm font-semibold">{projectDetails.timeline}</p>
            </div>

            {/* Total Project Fee */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total project fee</p>
              <p className="text-sm font-semibold">{projectDetails.totalFee}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
