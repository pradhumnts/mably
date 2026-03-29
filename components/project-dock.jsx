"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Folder, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dock, DockIcon } from "@/components/ui/dock";

export function ProjectDock({ projectId }) {
  const navItems = [
    { href: `/project/${projectId}/activity`, icon: Calendar, label: "Activity" },
    { href: `/project/${projectId}/library/files`, icon: Folder, label: "Library" },
    { href: `/project/${projectId}/payments`, icon: CreditCard, label: "Payments" },
    { href: `/project/${projectId}/settings`, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <TooltipProvider>
        <Dock direction="middle">
          {navItems.map((item) => (
            <DockIcon key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full"
                    )}
                  >
                    <item.icon className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
        </Dock>
      </TooltipProvider>
    </div>
  );
}
