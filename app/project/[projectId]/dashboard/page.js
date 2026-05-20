"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Folder, CreditCard } from "lucide-react";
import { usePortalProject } from "../project-portal-shell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { portalMobileNavBarClass } from "@/lib/ui/page-chrome";
import { BookCallCard } from "@/components/book-call-card";
import { PortalBrandBackdrop } from "@/components/portal-brand-backdrop";

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
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PortalBrandBackdrop variant="dashboard" />

      <header className={portalMobileNavBarClass}>
        <SidebarTrigger className="-ml-1" />
        <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
          {sidebar.projectName || "Project"}
        </span>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {showBookCall ? (
          <div className="shrink-0 px-4 pt-4 max-md:animate-none max-md:opacity-100 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 md:absolute md:right-8 md:top-8 md:z-20 md:px-0 md:pt-0">
            <BookCallCard
              freelancerName={dashboard.freelancerName}
              freelancerAvatar={dashboard.freelancerAvatar || undefined}
              calendarLink={dashboard.calendarLink?.trim() || "https://calendly.com/"}
            />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-12 lg:px-24 lg:py-16">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="mb-8 max-md:animate-none max-md:opacity-100 sm:mb-12 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 md:mb-12">
              <p className="mb-3 text-sm text-gray-600">Last Visit: {lastVisit}</p>
              <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
                Hi There, {clientName} <span className="inline-block">👋</span>
              </h1>
              <p className="text-base text-gray-800 sm:text-lg md:text-xl">
                Let&apos;s move this project forward — one step at a time.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-md:animate-none max-md:opacity-100 sm:gap-6 md:grid-cols-3 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {dashboardCards.map((card) => {
                const Icon = card.icon;
                const href = `/project/${projectId}${card.href}`;

                return (
                  <Link key={card.id} href={href}>
                    <Card className="relative overflow-hidden p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg">
                      <CardContent className="flex flex-col p-0">
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                        <h3 className="mb-2 mt-2 text-lg font-semibold text-gray-900">
                          {card.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
