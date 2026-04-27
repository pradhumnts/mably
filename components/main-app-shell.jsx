"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

/**
 * Shared shell for authenticated freelancer routes under (main).
 * @param {{ name: string, email: string, avatar: string | null }} user
 */
export function MainAppShell({ user, children }) {
  const pathname = usePathname();
  const isCreateProjectWizard = pathname.startsWith("/projects/new");

  if (isCreateProjectWizard) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <SidebarProvider>
      <Toaster />
      <AppSidebar user={user} />
      <SidebarInset className="flex min-h-screen flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
