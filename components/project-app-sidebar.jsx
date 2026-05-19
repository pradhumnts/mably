"use client";

import * as React from "react";
import {
  Home,
  Activity,
  Folder,
  CreditCard,
  Settings,
  Link as LinkIcon,
} from "lucide-react";
import { usePathname, useParams } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { ProjectNavUser } from "./project-nav-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function SidebarLogo({ projectName, planType, logoUrl }) {
  const { state } = useSidebar();
  const initial = (projectName || "?").trim().charAt(0).toUpperCase() || "?";

  const mark = (
    <Avatar className="h-10 w-10 shrink-0 rounded-lg bg-background">
      <AvatarImage src={logoUrl || undefined} alt={projectName || "Project"} className="object-cover rounded-lg" />
      <AvatarFallback className="rounded-lg text-sm font-semibold bg-muted text-muted-foreground">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  if (state === "collapsed") {
    return <div className="w-full flex justify-center p-2">{mark}</div>;
  }

  return (
    <div className="w-full flex items-center gap-3 p-2">
      {mark}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 truncate">{projectName}</h2>
        <p className="text-xs text-gray-500">{planType}</p>
      </div>
    </div>
  );
}

export function ProjectAppSidebar({ projectData, freelancerData, isFreelancer = false, ...props }) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId;
  
  // Navigation data for Project
  const navGeneral = [
    {
      title: "Dashboard",
      url: `/project/${projectId}/dashboard`,
      icon: Home,
      isActive: false,
    },
    {
      title: "Activity",
      url: `/project/${projectId}/activity`,
      icon: Activity,
      isActive: false,
    },
    {
      title: "Library",
      url: `/project/${projectId}/library/files`,
      icon: Folder,
      isActive: false,
      alwaysOpen: true,
      items: [
        {
          title: "Files",
          url: `/project/${projectId}/library/files`,
        },
        {
          title: "Links",
          url: `/project/${projectId}/library/links`,
        },
      ],
    },
    {
      title: "Payments",
      url: `/project/${projectId}/payments`,
      icon: CreditCard,
      isActive: false,
    },
  ];
  
  const navOther = [
    {
      title: "Settings",
      url: `/project/${projectId}/settings`,
      icon: Settings,
      isActive: false,
    },
  ];
  
  // Update active state based on current pathname
  const navGeneralWithActive = navGeneral.map(item => {
    const subItemIsActive =
      item.items?.some(
        (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/")
      ) ?? false;
    const itemIsActive =
      pathname === item.url ||
      pathname.startsWith(item.url + "/") ||
      subItemIsActive;

    // If item has sub-items, update their active state too
    if (item.items && item.items.length > 0) {
      return {
        ...item,
        isActive: itemIsActive,
        items: item.items.map(subItem => ({
          ...subItem,
          isActive: pathname === subItem.url || pathname.startsWith(subItem.url + '/'),
        })),
      };
    }
    
    return {
      ...item,
      isActive: itemIsActive,
    };
  });
  
  const navOtherWithActive = navOther.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }));
  
  const user = isFreelancer
    ? {
        name: freelancerData?.name || "Freelancer",
        email: freelancerData?.email || "",
        avatar: freelancerData?.avatar || null,
      }
    : {
        name: projectData?.clientName || "User",
        email: projectData?.clientEmail || "user@example.com",
        avatar: projectData?.clientAvatar || null,
      };
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo
          projectName={projectData?.projectName || "Project"}
          planType={projectData?.planType || "Active"}
          logoUrl={projectData?.logo || null}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navGeneralWithActive} label="General" />
        <NavMain items={navOtherWithActive} label="Other" />
      </SidebarContent>
      <SidebarFooter>
        <ProjectNavUser user={user} projectId={String(projectId)} isFreelancer={Boolean(isFreelancer)} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

