"use client";

import { createContext, useContext, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProjectAppSidebar } from "@/components/project-app-sidebar";
import { recordClientPortalFirstOpen } from "@/lib/actions/client-portal-first-open";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { FloatingChatWidget } from "@/components/floating-chat-widget";
import { PortalOnboardingDialog } from "@/components/portal-onboarding-dialog";
import { LegalFooterLinks } from "@/components/legal-footer-links";

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

  return (
    <PortalProjectContext.Provider value={bundle}>
      <SidebarProvider>
        <ProjectAppSidebar projectData={bundle.sidebar} isFreelancer={Boolean(bundle.meta?.isFreelancer)} />
        <SidebarInset className="flex min-h-screen flex-col">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <footer className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70">
            <LegalFooterLinks />
          </footer>
        </SidebarInset>
        <FloatingChatWidget
          projectId={projectId}
          userRole={userRole}
          portalChatPersonas={portalChatPersonas}
        />
      </SidebarProvider>
      <PortalOnboardingDialog
        projectId={String(projectId)}
        isFreelancer={Boolean(bundle.meta?.isFreelancer)}
        projectName={bundle.sidebar?.projectName}
      />
    </PortalProjectContext.Provider>
  );
}
