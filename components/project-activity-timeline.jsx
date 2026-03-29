"use client";

import { Calendar, Link as LinkIcon, AlertTriangle, CheckCircle, DollarSign, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProjectActivityTimeline({ project }) {
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
    <Card className="p-6 mb-6 gap-[16px]">
      {/* Project Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {project.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {project.description}
        </p>
        <div className="flex items-center gap-3 text-sm mt-[16px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {project.status}
          </div>
          {/* Vertical Divider */}
          <span className="mx-2 h-4 border-l border-zinc-300" />
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>Due {project.dueDate}</span>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Activity Log</h3>
        <div className="border-t border-zinc-200 mb-4" />
        
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-zinc-300" />
          
          <div className="space-y-[16px]">
            {project.activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex gap-3 relative${activity.comment ? '' : ' items-center'}`}
              >
                <div className="py-[8px] bg-white h-fit rounded-full">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0 relative z-10 bg-background">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                  </Avatar>
                </div>

                {/* Activity Content */}
                <div className={`flex-1 min-w-0 ${activity.comment ? 'pt-[16px]' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{activity.user.name}</span>
                    <span className="text-sm text-muted-foreground">{activity.action}</span>
                    {activity.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs flex items-center gap-1", getActivityBadgeColor(activity.badge.type))}
                      >
                        {getBadgeIcon(activity.badge.type)}
                        {activity.badge.text}
                      </Badge>
                    )}
                    {activity.fileLink && (
                      <>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="h-4 w-4" />
                          <span>{activity.fileLink}</span>
                        </div>
                        {activity.fileMetadata && activity.fileMetadata.needsApproval && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs bg-orange-100 py-[12px] px-[6px] text-orange-700 hover:bg-orange-100 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-700" strokeWidth={2} />
                              Needs Approval
                            </Badge>
                          </div>
                        )}
                      </>
                    )}
                    {activity.paymentDetails && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{activity.paymentDetails.amount}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {activity.paymentDetails.invoiceNumber}
                        </span>
                      </div>
                    )}
                    <div className="mx-1 inline-block align-middle w-[6px] h-[6px] rounded-full bg-zinc-300" />
                    <span className="text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>

                  {/* Nested Comment */}
                  {activity.comment && (
                    <Card className="mt-3 p-4 bg-muted/30">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1">{activity.user.name}</p>
                          <p className="text-sm text-foreground">{activity.comment}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
