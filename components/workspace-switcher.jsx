"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { setActiveWorkspace } from "@/lib/actions/active-workspace";
import { cn } from "@/lib/utils";

function personInitials(name, workspaceName) {
  const source = String(name || workspaceName || "W").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] || "W").slice(0, 2).toUpperCase();
}

function roleLabel(role) {
  if (role === "owner") return "Your workspace";
  if (role === "admin") return "Admin";
  if (role === "member") return "Member";
  return role || "Member";
}

/**
 * @param {{
 *   name: string;
 *   ownerName?: string | null;
 *   ownerAvatarUrl?: string | null;
 *   pending?: boolean;
 *   size?: "sm" | "md";
 *   selected?: boolean;
 * }} props
 */
function WorkspaceOwnerAvatar({
  name,
  ownerName,
  ownerAvatarUrl,
  pending = false,
  size = "md",
  selected = false,
}) {
  const dim = size === "sm" ? "size-8" : "size-8";
  const text = size === "sm" ? "text-[11px]" : "text-[11px]";
  return (
    <Avatar className={cn(dim, "shrink-0 rounded-lg")}>
      {pending ? (
        <AvatarFallback className="rounded-lg bg-[#FF701A] text-white">
          <Loader2 className="size-3.5 animate-spin" />
        </AvatarFallback>
      ) : (
        <>
          <AvatarImage
            src={ownerAvatarUrl || undefined}
            alt={ownerName || name}
            className="rounded-lg object-cover"
          />
          <AvatarFallback
            className={cn(
              "rounded-lg font-semibold tracking-wide",
              text,
              selected ? "bg-[#FF701A] text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {personInitials(ownerName, name)}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
}

/**
 * Only shown when the user belongs to 2+ workspaces.
 * Avatar = workspace owner's profile photo (no workspace branding settings yet).
 * @param {{
 *   workspaces: {
 *     workspaceId: string;
 *     name: string;
 *     role: string;
 *     ownerName?: string | null;
 *     ownerAvatarUrl?: string | null;
 *   }[];
 *   activeWorkspaceId: string | null;
 * }} props
 */
export function WorkspaceSwitcher({ workspaces = [], activeWorkspaceId = null }) {
  const { isMobile, state } = useSidebar();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useState(activeWorkspaceId);

  useEffect(() => {
    setOptimisticId(activeWorkspaceId);
  }, [activeWorkspaceId]);

  if (!Array.isArray(workspaces) || workspaces.length < 2) {
    return null;
  }

  const activeId = optimisticId || activeWorkspaceId || workspaces[0]?.workspaceId;
  const active = workspaces.find((w) => w.workspaceId === activeId) || workspaces[0];
  const yours = workspaces.filter((w) => w.role === "owner");
  const shared = workspaces.filter((w) => w.role !== "owner");

  const onSelect = (workspaceId) => {
    if (!workspaceId || workspaceId === active?.workspaceId || pending) return;
    setOptimisticId(workspaceId);
    startTransition(async () => {
      const res = await setActiveWorkspace(workspaceId);
      if (!res.ok) {
        setOptimisticId(activeWorkspaceId);
        toast.error(res.error || "Could not switch workspace");
        return;
      }
      toast.success(
        `Switched to ${workspaces.find((w) => w.workspaceId === workspaceId)?.name || "workspace"}`
      );
      router.refresh();
    });
  };

  const renderItem = (ws) => {
    const selected = ws.workspaceId === active?.workspaceId;
    return (
      <DropdownMenuItem
        key={ws.workspaceId}
        onClick={() => onSelect(ws.workspaceId)}
        className={cn("gap-3 p-2.5 cursor-pointer", selected && "bg-accent")}
      >
        <WorkspaceOwnerAvatar
          name={ws.name}
          ownerName={ws.ownerName}
          ownerAvatarUrl={ws.ownerAvatarUrl}
          selected={selected}
          size="sm"
        />
        <div className="grid min-w-0 flex-1 text-left leading-tight">
          <span className="truncate text-sm font-medium">{ws.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {roleLabel(ws.role)}
          </span>
        </div>
        {selected ? <Check className="size-4 shrink-0 text-[#FF701A]" /> : null}
      </DropdownMenuItem>
    );
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={`Switch workspace · ${active?.name || "Workspace"}`}
              className={cn(
                "h-12 gap-2.5 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-2",
                "hover:bg-sidebar-accent hover:border-sidebar-border",
                "data-[state=open]:bg-sidebar-accent data-[state=open]:border-sidebar-border",
                "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
              )}
              disabled={pending}
            >
              <WorkspaceOwnerAvatar
                name={active?.name || "Workspace"}
                ownerName={active?.ownerName}
                ownerAvatarUrl={active?.ownerAvatarUrl}
                pending={pending}
              />
              <div className="grid min-w-0 flex-1 text-left leading-snug group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[13px] font-semibold tracking-tight text-sidebar-foreground">
                  {active?.name || "Workspace"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {roleLabel(active?.role)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 rounded-xl p-1.5"
            align="start"
            side={isMobile || state === "collapsed" ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2.5 py-2 text-xs font-medium text-muted-foreground">
              Switch workspace
            </DropdownMenuLabel>
            {yours.length > 0 ? (
              <>
                <DropdownMenuLabel className="px-2.5 pt-1 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Yours
                </DropdownMenuLabel>
                {yours.map(renderItem)}
              </>
            ) : null}
            {yours.length > 0 && shared.length > 0 ? (
              <DropdownMenuSeparator className="my-1.5" />
            ) : null}
            {shared.length > 0 ? (
              <>
                <DropdownMenuLabel className="px-2.5 pt-1 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Shared with you
                </DropdownMenuLabel>
                {shared.map(renderItem)}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
