"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavMain({ items, label }) {
  const { state } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // If item has sub-items, make it collapsible
          if (item.items && item.items.length > 0) {
            // Always-open sections: skip Radix Collapsible (avoids SSR/client useId / aria-controls mismatches
            // with Tooltip + CollapsibleTrigger + asChild on the same control).
            if (item.alwaysOpen) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                    <a href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <Collapsible defaultOpen={item.isActive} className="group/collapsible w-full min-w-0">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            );
          }
          
          // Disabled / coming-soon item (no navigation)
          if (item.disabled) {
            const tooltip = item.comingSoon ? `${item.title} · Coming soon` : item.title;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  type="button"
                  aria-disabled="true"
                  tabIndex={-1}
                  onClick={(e) => e.preventDefault()}
                  tooltip={tooltip}
                  className="cursor-default opacity-80 hover:bg-transparent hover:text-sidebar-foreground/80"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.comingSoon && state === "expanded" ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-auto h-5 shrink-0 border-0 px-1.5 py-0 text-[10px] font-medium",
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      Coming soon
                    </Badge>
                  ) : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Simple menu item without collapsible
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

