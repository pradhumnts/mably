"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProjectLayoutWrapper } from "../project-layout-wrapper";
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
import { Search, FileX } from "lucide-react";
import { MilestoneActivityCard } from "@/components/milestone-activity-card";
import { ProjectActivityTimeline } from "@/components/project-activity-timeline";
import { ProjectDetailsSidebar } from "@/components/project-details-sidebar";

export default function ProjectActivity() {
  const params = useParams();
  const projectId = params.projectId;
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter function
  const filterActivities = (activities) => {
    let filtered = activities;

    // Apply category filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((activity) => {
        switch (activeFilter) {
          case "files":
            return activity.fileLink; // Has file link
          case "comments":
            return activity.comment || (activity.action && activity.action.includes("comment")); // Has comment or action mentions comment
          case "approvals":
            return activity.badge && (activity.badge.type === "Approved" || activity.action.includes("Approved")); // Has approval badge
          case "payments":
            return activity.badge && activity.badge.type === "Payment"; // Has payment badge
          default:
            return true;
        }
      });
    }

    // Apply search filter
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
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    return filtered;
  };

  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  };

  // Project type: 'milestone' or 'one-time'
  const projectType = "milestone"; // Change this to "one-time" to see one-time project view

  // Project details data for sidebar
  const projectDetailsData = {
    status: "In Progress",
    dueDate: "24 Sep",
    milestones: [
      {
        id: "m1",
        title: "Milestone 1: Discovery Call (Upfront Payment)",
        amount: "$1500.00",
        delivery: "1 Day Delivery • Oct 07",
        completed: true,
      },
      {
        id: "m2",
        title: "Milestone 2: Wireframes",
        amount: "$300.00",
        delivery: "12 Day Delivery • Oct 19",
        completed: true,
      },
      {
        id: "m3",
        title: "Milestone 3: UI Design",
        amount: "$300.00",
        delivery: "14 Day Delivery • Nov 3",
        completed: false,
      },
      {
        id: "m4",
        title: "Milestone 4: Development & Handoff",
        amount: "$300.00",
        delivery: "7 Day Delivery • Nov 10",
        completed: false,
      },
    ],
    timeline: "Oct 07, 2025 - Nov 10, 2025",
    totalFee: "$3000.00",
  };

  // One-time project data
  const oneTimeProject = {
    title: "Website Redesign Project",
    description: "Complete redesign of the company website including new branding, UI/UX improvements, and responsive implementation.",
    status: "In Progress",
    dueDate: "30 Sep",
    activities: [
      {
        id: "act-1",
        user: {
          name: "Sophie James",
          avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
        },
        action: "Approved the final design",
        badge: {
          type: "Approved",
          icon: "✓",
          text: "Approved",
        },
        timestamp: "Today",
      },
      {
        id: "act-2",
        user: {
          name: "Emma Reed",
          avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
        },
        action: "Uploaded final mockups",
        fileLink: "Website-Final-v3.fig",
        fileMetadata: {
          type: "figma",
          size: "3.2 MB",
          needsApproval: true,
        },
        viewedBy: ["Sophie James"],
        timestamp: "Yesterday",
        comment: "Here are the final mockups with all the requested changes. I've updated the color scheme and typography as discussed. Ready for your review!",
      },
      {
        id: "act-2a",
        user: {
          name: "Emma Reed",
          avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
        },
        action: "Sent final invoice",
        badge: {
          type: "Payment",
          icon: "💰",
          text: "Invoice Sent",
        },
        timestamp: "2 days ago",
        paymentDetails: {
          amount: "$1200.00",
          invoiceNumber: "INV-2003",
        },
      },
      {
        id: "act-3",
        user: {
          name: "Sophie James",
          avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
        },
        action: "left feedback",
        badge: {
          type: "Needs Change",
          icon: "💬",
          text: "Needs Change",
        },
        timestamp: "3 days ago",
        comment: "The overall design looks great! Just a few minor adjustments needed on the mobile navigation and footer layout.",
      },
      {
        id: "act-4",
        user: {
          name: "Emma Reed",
          avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
        },
        action: "Uploaded design mockups",
        fileLink: "Website-Mockup-v2.fig",
        fileMetadata: {
          type: "figma",
          size: "2.1 MB",
          needsApproval: false,
        },
        viewedBy: [],
        timestamp: "4 days ago",
      },
      {
        id: "act-5",
        user: {
          name: "Sophie James",
          avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
        },
        action: "Paid 50% upfront payment",
        badge: {
          type: "Payment",
          icon: "💰",
          text: "Paid",
        },
        timestamp: "1 week ago",
        paymentDetails: {
          amount: "$1500.00",
          invoiceNumber: "INV-2001",
        },
      },
      {
        id: "act-6",
        user: {
          name: "Sophie James",
          avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
        },
        action: "Approved wireframes",
        badge: {
          type: "Approved",
          icon: "✓",
          text: "Approved",
        },
        timestamp: "1 week ago",
      },
      {
        id: "act-7",
        user: {
          name: "Emma Reed",
          avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
        },
        action: "Sent project kickoff invoice",
        badge: {
          type: "Payment",
          icon: "💰",
          text: "Invoice Sent",
        },
        timestamp: "2 weeks ago",
        paymentDetails: {
          amount: "$1500.00",
          invoiceNumber: "INV-2001",
        },
      },
    ],
  };

  // Dummy milestone data
  const milestones = [
    {
      id: "milestone-3",
      title: "Milestone 3: UI Design (Visuals)",
      description: "Full-color mockups using approved wireframes and brand palette.",
      status: "In Progress",
      dueDate: "24 Sep",
      revisions: 2,
      activities: [
        {
          id: "act-1",
          user: {
            name: "Sophie James",
            avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
          },
          action: "Milestone marked as Approved by",
          badge: {
            type: "Approved",
            icon: "✓",
            text: "Approved",
          },
          timestamp: "Yesterday",
        },
        {
          id: "act-2",
          user: {
            name: "Sophie James",
            avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
          },
          action: "Approved the final version",
          badge: {
            type: "Approved",
            icon: "✓",
            text: "Approved",
          },
          timestamp: "Yesterday",
        },
        {
          id: "act-3",
          user: {
            name: "Emma Reed",
            avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
          },
          action: "Uploaded v2 of the mockup",
          fileLink: "Design - First Draft.fig",
          fileMetadata: {
            type: "figma",
            size: "2.4 MB",
            needsApproval: true,
          },
          viewedBy: ["Sophie James"],
          timestamp: "2 days ago",
          comment: "Refined the background as suggested — aiming for a lighter, calmer first impression. Let me know what you think!",
        },
        {
          id: "act-4",
          user: {
            name: "Sophie James",
            avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
          },
          action: "left a comment",
          badge: {
            type: "Needs Change",
            icon: "😊",
            text: "Needs Change",
          },
          timestamp: "3 days ago",
          comment: "This is looking super clean! Could we try a slightly softer background color in the hero section?",
        },
        {
          id: "act-5",
          user: {
            name: "Emma Reed",
            avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
          },
          action: "Uploaded homepage mockup v1",
          fileLink: "Design - First Draft.fig",
          fileMetadata: {
            type: "figma",
            size: "1.8 MB",
            needsApproval: true,
          },
          viewedBy: ["Sophie James"],
          timestamp: "3 days ago",
        },
        {
          id: "act-5a",
          user: {
            name: "Emma Reed",
            avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
          },
          action: "Sent invoice for Milestone 3",
          badge: {
            type: "Payment",
            icon: "💰",
            text: "Invoice Sent",
          },
          timestamp: "4 days ago",
          paymentDetails: {
            amount: "$300.00",
            invoiceNumber: "INV-1003",
          },
        },
      ],
    },
    {
      id: "milestone-1",
      title: "Milestone 1: Discovery & Strategy",
      description: "Kickoff call, gathering project goals, audience insights, and initial moodboarding.",
      status: "Wrapped Up",
      dueDate: "16 Sep",
      revisions: 6,
      activities: [
        {
          id: "act-6",
          user: {
            name: "Emma Reed",
            avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
          },
          action: "Milestone marked as Complete",
          badge: {
            type: "Approved",
            icon: "✓",
            text: "Complete",
          },
          timestamp: "1 week ago",
        },
        {
          id: "act-7",
          user: {
            name: "Sophie James",
            avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
          },
          action: "Approved the discovery document",
          badge: {
            type: "Approved",
            icon: "✓",
            text: "Approved",
          },
          timestamp: "1 week ago",
        },
        {
          id: "act-8",
          user: {
            name: "Sophie James",
            avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
          },
          action: "Paid invoice for Milestone 1",
          badge: {
            type: "Payment",
            icon: "💰",
            text: "Paid",
          },
          timestamp: "2 weeks ago",
          paymentDetails: {
            amount: "$1500.00",
            invoiceNumber: "INV-1001",
          },
        },
      ],
    },
  ];

  return (
    <ProjectLayoutWrapper projectData={projectData}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="h-4 my-auto mr-2"
          />
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

      {/* Content */}
      <div className="flex-1 z-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Activity
            </h1>
            <p className="text-muted-foreground">
              Track what's done, what's coming next, and what's currently in review
            </p>
          </div>

          {/* Search and Filters - Only above activity (constrained to 8 cols width) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Activity Filters */}
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

                {/* Search Input */}
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
          
          {/* Grid Layout: 8 cols for activity, 4 cols for sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Activity Content - 8 columns */}
            <div className="lg:col-span-8">
              {(() => {
                // Check if there are any results
                let hasResults = false;
                
                if (projectType === "one-time") {
                  hasResults = filterActivities(oneTimeProject.activities).length > 0;
                } else {
                  hasResults = milestones.some(milestone => 
                    filterActivities(milestone.activities).length > 0
                  );
                }

                // Show empty state if no results
                if (!hasResults) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="rounded-full bg-muted p-6 mb-4">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                      <p className="text-muted-foreground max-w-sm">
                        {searchQuery 
                          ? `No results found for "${searchQuery}". Try adjusting your search or filters.`
                          : "No activities match the selected filter. Try selecting a different filter."
                        }
                      </p>
                      {(searchQuery || activeFilter !== "all") && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery("");
                            setActiveFilter("all");
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  );
                }

                // Show activities
                return projectType === "one-time" ? (
                  <ProjectActivityTimeline 
                    project={{
                      ...oneTimeProject,
                      activities: filterActivities(oneTimeProject.activities)
                    }} 
                  />
                ) : (
                  <>
                    {milestones.map((milestone) => {
                      const filteredActivities = filterActivities(milestone.activities);
                      // Only show milestone if it has activities after filtering
                      if (filteredActivities.length === 0) return null;
                      
                      return (
                        <MilestoneActivityCard 
                          key={milestone.id} 
                          milestone={{
                            ...milestone,
                            activities: filteredActivities
                          }} 
                        />
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Sidebar - 4 columns */}
            <div className="lg:col-span-4">
              <ProjectDetailsSidebar 
                projectType={projectType}
                projectDetails={projectDetailsData}
              />
            </div>
          </div>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}

