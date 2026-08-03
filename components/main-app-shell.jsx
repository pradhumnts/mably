"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { EarlyPricingOfferHost } from "@/components/billing/early-pricing-offer-host";
import { PostHogIdentify } from "@/components/posthog-identify";
import { cn } from "@/lib/utils";
// import { LegalFooterLinks } from "@/components/legal-footer-links"; // hidden until legal pages are live

/**
 * Shared shell for authenticated freelancer routes under (main).
 * @param {{
 *   user: { id?: string; name: string; email: string; avatar: string | null; role?: string };
 *   children: import("react").ReactNode;
 *   hasSubscription?: boolean;
 *   subscription?: { plan_key?: string | null; status?: string | null } | null;
 * }} props
 */
export function MainAppShell({
  user,
  children,
  hasSubscription = false,
  subscription = null,
}) {
  const pathname = usePathname();
  const isCreateProjectWizard = pathname.startsWith("/projects/new");
  const isMessagesInbox = pathname === "/messages" || pathname.startsWith("/messages/");

  const identify = (
    <PostHogIdentify
      userId={user?.id}
      email={user?.email}
      name={user?.name}
      role={user?.role || "freelancer"}
      plan={subscription?.plan_key || "free"}
      subscriptionStatus={subscription?.status || "none"}
      hasSubscription={hasSubscription}
    />
  );

  if (isCreateProjectWizard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {identify}
        <div className="min-h-0 flex-1">{children}</div>
        {/* <footer className="shrink-0 border-t border-border/50 bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
          <LegalFooterLinks />
        </footer> */}
      </div>
    );
  }

  return (
    <SidebarProvider>
      {identify}
      <Toaster />
      <EarlyPricingOfferHost hasSubscription={hasSubscription} />
      <AppSidebar user={user} />
      <SidebarInset
        className={cn(
          "flex flex-col",
          isMessagesInbox ? "h-svh overflow-hidden" : "min-h-screen"
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isMessagesInbox && "overflow-hidden"
          )}
        >
          {children}
        </div>
        {/* <footer className="shrink-0 border-t border-border/50 bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
          <LegalFooterLinks />
        </footer> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
