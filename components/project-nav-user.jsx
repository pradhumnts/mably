"use client";

import { ChevronsUpDown, LogOut, MessageCircle, User } from "lucide-react";
import { ChatWithTeamDialog } from "@/components/chat-with-team-dialog";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/actions";

/**
 * Portal sidebar footer.
 * - Client: Profile + Log out.
 * - Freelancer: Exit portal (back to /projects) + Log out.
 *
 * @param {{
 *   user: { name?: string; email?: string; avatar?: string | null };
 *   projectId: string;
 *   isFreelancer: boolean;
 * }}
 */
export function ProjectNavUser({ user, projectId, isFreelancer }) {
  const { isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [teamChatOpen, setTeamChatOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const pid = typeof projectId === "string" ? projectId : String(projectId ?? "");
  const portalSettingsHref = pid ? `/project/${pid}/settings` : "/settings";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                <AvatarFallback className="rounded-lg">
                  {(user.name || "CN").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                  <AvatarFallback className="rounded-lg">
                    {(user.name || "CN").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isFreelancer ? (
                <DropdownMenuItem asChild>
                  <Link
                    href="/projects"
                    className={cn(
                      "cursor-pointer",
                      "bg-sky-500/[0.06] dark:bg-sky-500/10",
                      "hover:bg-sky-500/10 dark:hover:bg-sky-500/15",
                      "data-[highlighted]:bg-sky-500/10 dark:data-[highlighted]:bg-sky-500/15"
                    )}
                  >
                    <LogOut
                      className="size-4 shrink-0"
                      aria-hidden
                    />
                    <span>Exit portal</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-sky-700/70 dark:text-sky-300/70">
                      All projects
                    </span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={portalSettingsHref} className="cursor-pointer">
                    <User className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setTeamChatOpen(true);
              }}
            >
              <MessageCircle className="size-4" />
              Chat with team
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleLogout()} disabled={isLoggingOut}>
              <LogOut className="size-4" />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ChatWithTeamDialog
          open={teamChatOpen}
          onOpenChange={setTeamChatOpen}
          user={user}
          projectId={pid}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
