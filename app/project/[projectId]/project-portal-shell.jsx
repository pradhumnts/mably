"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { DEMO_PORTAL_VIEW_STORAGE_KEY } from "@/lib/data/demo-project";
// import { LegalFooterLinks } from "@/components/legal-footer-links"; // hidden until legal pages are live

const PortalProjectContext = createContext(null);

export function usePortalProject() {
  const ctx = useContext(PortalProjectContext);
  if (!ctx) {
    throw new Error("usePortalProject must be used within ProjectPortalShell");
  }
  return ctx;
}

/**
 * @param {"freelancer" | "client"} view
 */
function persistDemoView(view) {
  try {
    window.sessionStorage.setItem(DEMO_PORTAL_VIEW_STORAGE_KEY, view);
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * @returns {"freelancer" | "client"}
 */
function readStoredDemoView() {
  try {
    const raw = window.sessionStorage.getItem(DEMO_PORTAL_VIEW_STORAGE_KEY);
    return raw === "freelancer" ? "freelancer" : "client";
  } catch {
    return "client";
  }
}

export function ProjectPortalShell({ bundle, children }) {
  const params = useParams();
  const projectId = params.projectId ?? bundle.projectId;
  const isDemo = Boolean(bundle.meta?.isDemo);
  const [demoView, setDemoView] = useState(/** @type {"freelancer" | "client"} */ ("client"));
  const [demoViewReady, setDemoViewReady] = useState(!isDemo);

  useEffect(() => {
    if (!isDemo) return;
    setDemoView(readStoredDemoView());
    setDemoViewReady(true);
  }, [isDemo]);

  const isFreelancer = isDemo
    ? demoView === "freelancer"
    : Boolean(bundle.meta?.isFreelancer);
  const userRole = isFreelancer ? "freelancer" : "client";

  const portalBundle = useMemo(() => {
    if (!isDemo) return bundle;
    return {
      ...bundle,
      meta: {
        ...bundle.meta,
        isFreelancer,
        isDemo: true,
      },
    };
  }, [bundle, isDemo, isFreelancer]);

  useEffect(() => {
    if (!projectId || isFreelancer || isDemo) return;
    void recordClientPortalFirstOpen(projectId);
  }, [projectId, isFreelancer, isDemo]);

  const setDemoRole = (next) => {
    const view = next === "client" ? "client" : "freelancer";
    setDemoView(view);
    persistDemoView(view);
  };

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
    <PortalProjectContext.Provider value={portalBundle}>
      <PortalBrandProvider brandColor={bundle.branding?.brandColor}>
      <SidebarProvider>
        <ProjectAppSidebar
          projectData={bundle.sidebar}
          freelancerData={freelancerData}
          isFreelancer={isFreelancer}
        />
        <SidebarInset className="flex min-h-screen flex-col">
          {isDemo ? (
            <div className="sticky top-0 z-30 border-b border-orange-200/40 bg-gradient-to-br from-orange-50/90 via-background to-violet-50/40 px-4 py-2.5 backdrop-blur-sm dark:border-orange-900/30 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs sm:justify-between sm:text-left sm:text-sm">
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/50 bg-white/70 px-2.5 py-0.5 font-semibold text-orange-700 shadow-sm dark:border-orange-700/40 dark:bg-orange-950/40 dark:text-orange-200">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Demo
                  </span>
                  <span className="font-medium text-foreground/85">
                    Sample project — changes aren&apos;t saved.
                  </span>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-zinc-900 hover:underline dark:text-zinc-200 dark:hover:text-white"
                  >
                    Create your project
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>

                <div
                  className={cn(
                    "inline-flex items-center rounded-full border border-black/8 bg-white/70 p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
                    !demoViewReady && "opacity-0"
                  )}
                  role="group"
                  aria-label="Demo view"
                >
                  <button
                    type="button"
                    onClick={() => setDemoRole("freelancer")}
                    aria-pressed={isFreelancer}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium tracking-tight transition sm:text-xs",
                      isFreelancer
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}
                  >
                    Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoRole("client")}
                    aria-pressed={!isFreelancer}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium tracking-tight transition sm:text-xs",
                      !isFreelancer
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                    )}
                  >
                    Client
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          {/* <footer className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70">
            <LegalFooterLinks />
          </footer> */}
        </SidebarInset>
        {!isDemo ? <WebPushManager /> : null}
        <FloatingChatWidget
          projectId={projectId}
          userRole={userRole}
          portalChatPersonas={portalChatPersonas}
        />
        <PortalOnboardingDialog
          projectId={String(projectId)}
          isFreelancer={isFreelancer}
          projectName={bundle.sidebar?.projectName}
        />
      </SidebarProvider>
      </PortalBrandProvider>
    </PortalProjectContext.Provider>
  );
}
