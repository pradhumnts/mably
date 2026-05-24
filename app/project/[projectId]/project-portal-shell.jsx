"use client";

import { createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { ProjectAppSidebar } from "@/components/project-app-sidebar";
import { recordClientPortalFirstOpen } from "@/lib/actions/client-portal-first-open";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { FloatingChatWidget } from "@/components/floating-chat-widget";
import { PortalOnboardingDialog } from "@/components/portal-onboarding-dialog";
import { WebPushManager } from "@/components/web-push-manager";
import { PortalBrandProvider } from "@/components/portal-brand";
// import { LegalFooterLinks } from "@/components/legal-footer-links"; // hidden until legal pages are live

const PortalProjectContext = createContext(null);

export function usePortalProject() {
  const ctx = useContext(PortalProjectContext);
  if (!ctx) {
    throw new Error("usePortalProject must be used within ProjectPortalShell");
  }
  return ctx;
}

export function ProjectPortalShell({ bundle, children }) {
  const params = useParams();
  const projectId = params.projectId ?? bundle.projectId;
  const isFreelancer = bundle.meta?.isFreelancer;
  const userRole = isFreelancer ? "freelancer" : "client";
  const isDemo = Boolean(bundle.meta?.isDemo);

  useEffect(() => {
    if (!projectId || Boolean(bundle.meta?.isFreelancer)) return;
    void recordClientPortalFirstOpen(projectId);
  }, [projectId, bundle.meta?.isFreelancer]);

  const portalChatPersonas = {
    projectName: bundle.sidebar?.projectName,
    projectLogo: bundle.sidebar?.logo ?? null,
    clientName: bundle.sidebar?.clientName,
    clientAvatar: bundle.sidebar?.clientAvatar ?? null,
    freelancerName: bundle.dashboard?.freelancerName,
    freelancerAvatar: bundle.dashboard?.freelancerAvatar ?? null,
  };

  const freelancerData = {
    name: bundle.dashboard?.freelancerName || "Freelancer",
    email: bundle.dashboard?.freelancerEmail || "",
    avatar: bundle.dashboard?.freelancerAvatar || null,
  };

  return (
    <PortalProjectContext.Provider value={bundle}>
      <PortalBrandProvider brandColor={bundle.branding?.brandColor}>
      <SidebarProvider>
        <ProjectAppSidebar
          projectData={bundle.sidebar}
          freelancerData={freelancerData}
          isFreelancer={Boolean(bundle.meta?.isFreelancer)}
        />
        <SidebarInset className="flex min-h-screen flex-col">
          {isDemo ? (
            <div className="sticky top-0 z-30 border-b border-orange-200/40 bg-gradient-to-br from-orange-50/90 via-background to-violet-50/40 px-4 py-2.5 backdrop-blur-sm dark:border-orange-900/30 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/50 bg-white/70 px-2.5 py-0.5 font-semibold text-orange-700 shadow-sm dark:border-orange-700/40 dark:bg-orange-950/40 dark:text-orange-200">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Demo
                </span>
                <span className="font-medium text-foreground/85">
                  You&apos;re exploring a sample project — changes here aren&apos;t saved.
                </span>
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-1 font-semibold text-orange-700 hover:text-orange-800 hover:underline dark:text-orange-200 dark:hover:text-orange-100"
                >
                  Create your first real project
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          {/* <footer className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70">
            <LegalFooterLinks />
          </footer> */}
        </SidebarInset>
        <WebPushManager />
        <FloatingChatWidget
          projectId={projectId}
          userRole={userRole}
          portalChatPersonas={portalChatPersonas}
        />
        <PortalOnboardingDialog
          projectId={String(projectId)}
          isFreelancer={Boolean(bundle.meta?.isFreelancer)}
          projectName={bundle.sidebar?.projectName}
        />
      </SidebarProvider>
      </PortalBrandProvider>
    </PortalProjectContext.Provider>
  );
}
