"use client";

import * as React from "react";
import {
  Home,
  Activity,
  Folder,
  CreditCard,
  Settings,
  FileText,
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

function SidebarLogo({ projectName, planType }) {
  const { state } = useSidebar();
  
  if (state === "collapsed") {
    return (
      <div className="w-full flex justify-center p-2">
        <div className="w-10 h-10 p-1 bg-white border border-zinc-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <img
            src="/images/Logo-icon.svg"
            alt=""
            className="w-6 h-6"
            draggable={false}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full flex items-center gap-3 p-2 ">
      <div className="w-10 h-10 bg-white border border-zinc-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <img
          src="/images/Logo-icon.svg"
          alt=""
          className="w-6 h-6"
          draggable={false}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 truncate">
          {projectName}
        </h2>
        <p className="text-xs text-gray-500">
          {planType}
        </p>
      </div>
    </div>
  );
}

export function ProjectAppSidebar({ projectData, ...props }) {
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
    const itemIsActive = pathname === item.url || pathname.startsWith(item.url + '/');
    
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
  
  const user = {
    name: projectData?.clientName || "User",
    email: projectData?.clientEmail || "user@example.com",
    avatar: projectData?.clientAvatar || null,
  };
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo 
          projectName={projectData?.projectName || "Project Name"} 
          planType={projectData?.planType || "Enterprise"} 
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navGeneralWithActive} label="General" />
        <NavMain items={navOtherWithActive} label="Other" />
      </SidebarContent>
      <SidebarFooter>
        <ProjectNavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

