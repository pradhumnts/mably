"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { LegalFooterLinks } from "@/components/legal-footer-links";

/**
 * Shared shell for authenticated freelancer routes under (main).
 * @param {{ name: string, email: string, avatar: string | null }} user
 */
export function MainAppShell({ user, children }) {
  const pathname = usePathname();
  const isCreateProjectWizard = pathname.startsWith("/projects/new");

  if (isCreateProjectWizard) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="min-h-0 flex-1">{children}</div>
        <footer className="shrink-0 border-t border-border/50 bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
          <LegalFooterLinks />
        </footer>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Toaster />
      <AppSidebar user={user} />
      <SidebarInset className="flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <footer className="shrink-0 border-t border-border/50 bg-background/95 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
          <LegalFooterLinks />
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
