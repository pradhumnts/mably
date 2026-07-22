"use client";

import { format, parseISO } from "date-fns";
import { usePortalProject } from "@/app/project/[projectId]/project-portal-shell";
import { ActionDescriptionView } from "@/components/actions/action-description-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * @param {string | null | undefined} name
 */
function avatarInitial(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/**
 * @param {string | null | undefined} due
 */
function formatDueLabel(due) {
  if (!due) return null;
  const d = parseISO(due);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "MMM d, yyyy");
}

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   action: null | {
 *     id: string;
 *     title: string;
 *     notes?: string | null;
 *     owner: "freelancer" | "client";
 *     dueDate?: string | null;
 *     status?: "open" | "done";
 *   };
 *   canEdit?: boolean;
 *   onEdit?: () => void;
 * }} props
 */
export function ViewActionDialog({
  open,
  onOpenChange,
  projectId,
  action,
  canEdit = false,
  onEdit,
}) {
  const { sidebar, dashboard } = usePortalProject();
  const freelancerName = dashboard?.freelancerName?.trim() || "You";
  const freelancerAvatar = dashboard?.freelancerAvatar || null;
  const clientName = sidebar?.clientName?.trim() || "Client";
  const clientAvatar = sidebar?.clientAvatar || null;

  const forClient = action?.owner === "client";
  const ownerName = forClient ? clientName : freelancerName;
  const ownerAvatar = forClient ? clientAvatar : freelancerAvatar;
  const ownerSubtitle = forClient ? "Shared with client" : "Private · For you";
  const dueLabel = formatDueLabel(action?.dueDate);

  return (
    <Dialog open={open && Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold leading-snug">
            {action?.title || "Action"}
          </DialogTitle>
          <DialogDescription>
            {action?.status === "done" ? "Completed action" : "Action details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Who is this for?</p>
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5"
              )}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={ownerAvatar || undefined} alt={ownerName} />
                <AvatarFallback className="text-xs font-medium">
                  {avatarInitial(ownerName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {forClient ? clientName : "For me"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ownerSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Due date</p>
            <p className="text-sm text-muted-foreground">
              {dueLabel || "No due date"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Description</p>
            <div className="rounded-xl border border-border/70 bg-background px-3 py-3">
              <ActionDescriptionView
                html={action?.notes}
                projectId={projectId}
                emptyLabel="No description"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {canEdit && onEdit ? (
            <Button type="button" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
