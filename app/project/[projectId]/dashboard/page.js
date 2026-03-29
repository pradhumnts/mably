"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Folder, CreditCard } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProjectDock } from "@/components/project-dock";
import { BookCallCard } from "@/components/book-call-card";

const dashboardCards = [
  {
    id: "activity",
    title: "Project Activity",
    description: "Track progress, deadlines, and tasks",
    icon: Calendar,
    href: "/activity",
  },
  {
    id: "library",
    title: "Library",
    description: "Download latest designs, docs, etc.",
    icon: Folder,
    href: "/library/files",
  },
  {
    id: "payments",
    title: "Payments",
    description: "View invoices and pay securely",
    icon: CreditCard,
    href: "/payments",
  },
];

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.projectId;

  // In the future, fetch project data and last visit time from database
  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "shophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  };

  const lastVisit = "Yesterday 2:41 PM";
  const clientName = "Sophie";

  return (
    <ProjectLayoutWrapper projectData={projectData}>
      <div className="relative flex flex-col min-h-screen overflow-hidden">
        {/* Background Image - Only on dashboard */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/dashboard-bg.webp"
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Book a Call Card - Top Right */}
        <div className="absolute top-8 right-8 z-20 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <BookCallCard 
            freelancerName="Emma"
            freelancerAvatar="https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            calendarLink="https://calendly.com/"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 align-center items-center justify-center h-full px-[100px] pb-[100px]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 align-center flex flex-col justify-center h-full">
            {/* Header */}
            <div className="mb-12 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <p className="text-sm text-gray-600 mb-4">
                Last Visit: {lastVisit}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Hi There, {clientName}{" "}
                <span className="inline-block">👋</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-800">
                Let&apos;s move this project forward — one step at a time.
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {dashboardCards.map((card) => {
                const Icon = card.icon;
                const href = `/project/${projectId}${card.href}`;

                return (
                  <Link key={card.id} href={href}>
                    <Card className="overflow-hidden hover:shadow-lg shadow-sm transition-shadow p-[16px] duration-200 relative">
                      <CardContent className="p-0 flex flex-col">
                        {/* Content */}
                        <div className="flex-1 relative z-10">
                          <Icon className="w-[24px] h-[24px]" strokeWidth={1.5} />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-2">
                            {card.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dock */}
        {/* <div className="[animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms]">
          <ProjectDock projectId={projectId} />
        </div> */}
      </div>
    </ProjectLayoutWrapper>
  );
}

