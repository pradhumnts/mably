"use client";

import * as React from "react";
import { ClipboardList, Users, Settings, CreditCard } from "lucide-react";
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
      title: "Billing",
      url: "/billing",
      icon: CreditCard,
      isActive: false,
    },
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

  // Update active state based on current pathname
  const navGeneralWithActive = navData.navGeneral.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
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
      <SidebarRail />
    </Sidebar>
  );
}

