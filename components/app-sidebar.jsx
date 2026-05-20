"use client";

import * as React from "react";
import { ClipboardList, Home, Users, Settings } from "lucide-react";
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

const navData = {
  navGeneral: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: false,
      disabled: true,
      comingSoon: true,
    },
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

export function AppSidebar({ user, ...props }) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const navGeneralItems = isMobile
    ? navData.navGeneral.filter((item) => !item.disabled)
    : navData.navGeneral;

  // Update active state based on current pathname
  const navGeneralWithActive = navGeneralItems.map((item) => ({
    ...item,
    isActive: item.disabled
      ? false
      : pathname === item.url || pathname.startsWith(item.url + "/"),
  }));
  
  const navOtherWithActive = navData.navOther.map((item) => ({
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail className="hidden md:flex" />
    </Sidebar>
  );
}

