"use client";

import { useParams } from "next/navigation";
import { ProjectAppSidebar } from "@/components/project-app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { FloatingChatWidget } from "@/components/floating-chat-widget";

export function ProjectLayoutWrapper({ children, projectData }) {
  const params = useParams();
  const projectId = params.projectId;

  return (
    <SidebarProvider>
      <ProjectAppSidebar projectData={projectData} />
      <SidebarInset>
        {children}
      </SidebarInset>
      <FloatingChatWidget
        projectId={projectId}
        userName={projectData?.clientName || "User"}
        userRole="client"
        projectData={projectData}
      />
    </SidebarProvider>
  );
}

