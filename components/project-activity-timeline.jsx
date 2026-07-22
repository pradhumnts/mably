"use client";

import Link from "next/link";
import {
  Calendar,
  CheckSquare2,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DescriptionClamp } from "@/components/description-clamp";
import { LibraryVoiceNotePlayer } from "@/components/library-voice-note-player";
import { DEMO_PROJECT_ID } from "@/lib/data/demo-project";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";

const linkActionClass =
  "inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-2 hover:underline";

export function ProjectActivityTimeline({ project }) {
  const projectId = project?.projectId ? String(project.projectId) : "";

  const getActivityBadgeColor = (type) => {
    switch (type) {
      case "Approved":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "Needs Change":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100";
      case "Uploaded":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "Payment":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  const getBadgeIcon = (type) => {
    switch (type) {
      case "Approved":
        return <CheckCircle className="h-3 w-3" />;
      case "Payment":
        return <DollarSign className="h-3 w-3" />;
      case "Needs Change":
        return <MessageCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6 gap-4 p-4 sm:gap-[16px] sm:p-6">
      <div>
        {projectId ? (
          <Link href={`/project/${projectId}/dashboard`} className="group block">
            <h2 className="mb-2 text-xl font-semibold text-foreground group-hover:underline sm:text-2xl">
              {project.title}
            </h2>
          </Link>
        ) : (
          <h2 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">{project.title}</h2>
        )}
        <DescriptionClamp
          text={project.description}
          className="text-sm text-muted-foreground mb-4"
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:mt-[16px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            {project.status}
          </div>
          <span className="hidden h-4 border-l border-zinc-300 sm:block" />
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Due {project.dueDate}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold sm:text-xl">Activity Log</h3>
        <div className="border-t border-zinc-200 mb-4" />

        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-zinc-300 sm:left-5" aria-hidden />

          <div className="space-y-[16px]">
            {project.activities.map((activity) => {
              const inlineResourceLinked = Boolean(
                activity.destinationHref &&
                  (activity.fileLink || activity.paymentDetails)
              );
              const showSecondaryActions =
                Boolean(activity.externalHref) ||
                Boolean(
                  activity.destinationHref &&
                    !inlineResourceLinked &&
                    !activity.voiceNote
                );
              const isActionEvent =
                activity.eventType === PROJECT_ACTIVITY_EVENT_TYPES.ACTION_CREATED ||
                activity.eventType === PROJECT_ACTIVITY_EVENT_TYPES.ACTION_COMPLETED;
              const FileLinkIcon = isActionEvent ? CheckSquare2 : LinkIcon;

              return (
                <div
                  key={activity.id}
                  className={`flex gap-3 relative${activity.comment || activity.voiceNote ? "" : " items-center"}`}
                >
                  <div className="py-[8px] bg-white h-fit rounded-full">
                    <Avatar className="h-10 w-10 flex-shrink-0 relative z-10 bg-background">
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                      <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div
                    className={`flex-1 min-w-0 ${activity.comment || activity.voiceNote ? "pt-[16px]" : ""}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{activity.user.name}</span>
                      <span className="text-sm text-muted-foreground">{activity.action}</span>
                      {activity.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs flex items-center gap-1",
                            getActivityBadgeColor(activity.badge.type)
                          )}
                        >
                          {getBadgeIcon(activity.badge.type)}
                          {activity.badge.text}
                        </Badge>
                      )}
                      {activity.fileLink && (
                        <>
                          <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                            <FileLinkIcon className="h-4 w-4 shrink-0" />
                            {activity.destinationHref ? (
                              <Link
                                href={activity.destinationHref}
                                className="truncate text-foreground underline-offset-2 hover:underline"
                              >
                                {activity.fileLink}
                              </Link>
                            ) : (
                              <span className="truncate">{activity.fileLink}</span>
                            )}
                          </div>
                          {activity.fileMetadata && activity.fileMetadata.needsApproval && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-orange-100 py-[12px] px-[6px] text-orange-700 hover:bg-orange-100 flex items-center gap-1"
                              >
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-orange-700"
                                  strokeWidth={2}
                                />
                                Needs Approval
                              </Badge>
                            </div>
                          )}
                        </>
                      )}
                      {activity.paymentDetails && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground min-w-0">
                          {activity.destinationHref ? (
                            <Link
                              href={activity.destinationHref}
                              className="inline-flex flex-wrap items-center gap-x-2 gap-y-0 text-foreground underline-offset-2 hover:underline"
                            >
                              <span>{activity.paymentDetails.amount}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {activity.paymentDetails.invoiceNumber}
                              </span>
                            </Link>
                          ) : (
                            <>
                              <span>{activity.paymentDetails.amount}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {activity.paymentDetails.invoiceNumber}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="mx-1 inline-block align-middle w-[6px] h-[6px] rounded-full bg-zinc-300" />
                      <span className="text-muted-foreground">{activity.timestamp}</span>
                    </div>

                    {showSecondaryActions ? (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {activity.destinationHref &&
                        activity.destinationLabel &&
                        !inlineResourceLinked ? (
                          <Link href={activity.destinationHref} className={linkActionClass}>
                            {activity.destinationLabel}
                          </Link>
                        ) : null}
                        {activity.externalHref && activity.externalLabel ? (
                          <a
                            href={activity.externalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkActionClass}
                          >
                            {activity.externalLabel}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {activity.voiceNote ? (
                      <Card className="mt-3 bg-muted/30 p-3 sm:p-4">
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                              <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">{activity.user.name}</p>
                            </div>
                          </div>
                          <div className="w-full max-w-md">
                          <LibraryVoiceNotePlayer
                            projectId={activity.voiceNote.projectId}
                            fileId={activity.voiceNote.fileId}
                            commentId={activity.voiceNote.commentId}
                            durationMs={activity.voiceNote.durationMs}
                            waveform={activity.voiceNote.waveform}
                            listened={false}
                            demoPreview={activity.voiceNote.projectId === DEMO_PROJECT_ID}
                          />
                          </div>
                          {activity.voiceNote.caption ? (
                            <p className="text-sm whitespace-pre-wrap break-words text-foreground">
                              {activity.voiceNote.caption}
                            </p>
                          ) : null}
                          {activity.destinationHref ? (
                            <p>
                              <Link href={activity.destinationHref} className={linkActionClass}>
                                {activity.destinationLabel || "Open Discussion"}
                              </Link>
                            </p>
                          ) : null}
                        </div>
                      </Card>
                    ) : null}

                    {activity.comment ? (
                      <Card className="mt-3 bg-muted/30 p-3 sm:p-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                            <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-sm font-semibold">{activity.user.name}</p>
                            <p className="flex min-w-0 items-baseline text-sm text-foreground">
                              <span className="min-w-0 truncate">{activity.comment}</span>
                              {activity.destinationHref ? (
                                <Link
                                  href={activity.destinationHref}
                                  className={cn(linkActionClass, "shrink-0 whitespace-nowrap text-sm font-medium")}
                                >
                                 Open Discussion
                                </Link>
                           
                              ) : null}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
