"use client";

import * as React from "react";
import {
  ClipboardList,
  Users,
  Settings,
  Lightbulb,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";

// Navigation data for Mably
const data = {
  user: {
    name: "Emma Reed",
    email: "emma@designstudio.com",
    avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  navGeneral: [
    {
      title: "Projects",
      url: "/projects",
      icon: ClipboardList,
      isActive: false,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Users,
      isActive: false,
    },
    {
      title: "Suggest Feature",
      url: "/features",
      icon: Lightbulb,
      isActive: false,
    },
  ],
  navOther: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: false,
    },
  ],
};

function SidebarLogo() {
  const { state } = useSidebar();
  
  return (
    <div className="w-full flex">
      {state === "expanded" ? (
        <img
          src="/images/Logo-SVG.svg"
          alt="Logo"
          className="center z-2 w-32 p-[8px] pt-[12px] transition duration-300"
          draggable={false}
        />
      ) : (
        <img
          src="/images/Logo-icon.svg"
          alt="Logo Icon"
          className="center z-2 w-10 p-[2px] py-[12px] transition duration-300"
          draggable={false}
        />
      )}
    </div>
  );
}

export function AppSidebar({ ...props }) {
  const pathname = usePathname();
  
  // Update active state based on current pathname
  const navGeneralWithActive = data.navGeneral.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }));
  
  const navOtherWithActive = data.navOther.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }));
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navGeneralWithActive} label="General" />
        <NavMain items={navOtherWithActive} label="Other" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

