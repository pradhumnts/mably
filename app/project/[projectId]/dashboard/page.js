"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Folder, CreditCard } from "lucide-react";
import { usePortalProject } from "../project-portal-shell";
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
  const { sidebar, dashboard, meta } = usePortalProject();
  const showBookCall = !meta?.isFreelancer;

  const lastVisit = "Yesterday 2:41 PM";
  const clientName = sidebar.clientName?.split(/\s+/)[0] || "there";

  return (
    <>
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

        {/* Book a Call — clients only (freelancers manage calendar in main app) */}
        {showBookCall ? (
          <div className="absolute top-8 right-8 z-20 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <BookCallCard
              freelancerName={dashboard.freelancerName}
              freelancerAvatar={dashboard.freelancerAvatar || undefined}
              calendarLink={dashboard.calendarLink?.trim() || "https://calendly.com/"}
            />
          </div>
        ) : null}

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
    </>
  );
}

