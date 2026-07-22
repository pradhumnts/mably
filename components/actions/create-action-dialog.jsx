"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { usePortalProject } from "@/app/project/[projectId]/project-portal-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ActionDescriptionEditor,
  stripActionDescriptionHtml,
} from "@/components/actions/action-description-editor";
import {
  createProjectAction,
  updateProjectAction,
} from "@/lib/actions/project-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * @param {string | null | undefined} name
 */
function avatarInitial(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/**
 * @param {string | null | undefined} due
 * @returns {Date | undefined}
 */
function parseDue(due) {
  if (!due) return undefined;
  const d = parseISO(due);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   action?: {
 *     id: string;
 *     title: string;
 *     notes?: string;
 *     owner: "freelancer" | "client";
 *     dueDate?: string | null;
 *   } | null;
 *   onSaved?: () => void;
 * }} props
 */
export function CreateActionDialog({
  open,
  onOpenChange,
  projectId,
  action = null,
  onSaved,
}) {
  const { sidebar, dashboard } = usePortalProject();
  const freelancerName = dashboard?.freelancerName?.trim() || "You";
  const freelancerAvatar = dashboard?.freelancerAvatar || null;
  const clientName = sidebar?.clientName?.trim() || "Client";
  const clientAvatar = sidebar?.clientAvatar || null;

  const isEdit = Boolean(action?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(/** @type {"freelancer" | "client"} */ ("freelancer"));
  const [dueDate, setDueDate] = useState(/** @type {Date | undefined} */ (undefined));
  const [dueOpen, setDueOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (action?.id) {
      setTitle(action.title || "");
      setDescription(action.notes || "");
      setOwner(action.owner === "client" ? "client" : "freelancer");
      setDueDate(parseDue(action.dueDate));
    } else {
      setTitle("");
      setDescription("");
      setOwner("freelancer");
      setDueDate(undefined);
    }
    setDueOpen(false);
    setSubmitting(false);
  }, [open, action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Add a short title");
      return;
    }

    const notes = stripActionDescriptionHtml(description) ? description : null;

    const payload = {
      title: trimmed,
      owner,
      dueDate: dueDate ?? null,
      notes,
    };

    setSubmitting(true);
    const res = isEdit
      ? await updateProjectAction(projectId, action.id, payload)
      : await createProjectAction(projectId, payload);
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error || (isEdit ? "Could not update action" : "Could not add action"));
      return;
    }

    toast.success(isEdit ? "Action updated" : "Action added");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Edit action" : "Add action"}
          </DialogTitle>
          <DialogDescription>
            Track a client commitment or deadline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="action-title">What needs to happen?</Label>
            <Input
              id="action-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Send revised homepage"
              maxLength={200}
              required
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Who is this for?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setOwner("freelancer")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  owner === "freelancer"
                    ? "border-foreground/20 bg-muted"
                    : "border-border/70 hover:bg-muted/50"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={freelancerAvatar || undefined} alt={freelancerName} />
                  <AvatarFallback className="text-xs font-medium">
                    {avatarInitial(freelancerName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    For me
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Private
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setOwner("client")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  owner === "client"
                    ? "border-foreground/20 bg-muted"
                    : "border-border/70 hover:bg-muted/50"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={clientAvatar || undefined} alt={clientName} />
                  <AvatarFallback className="text-xs font-medium">
                    {avatarInitial(clientName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {clientName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    Shared with them
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <Popover open={dueOpen} onOpenChange={setDueOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  className={cn(
                    "w-full justify-between font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Optional"}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    setDueDate(d);
                    setDueOpen(false);
                  }}
                  initialFocus
                />
                {dueDate ? (
                  <div className="border-t border-border/60 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setDueDate(undefined);
                        setDueOpen(false);
                      }}
                    >
                      Clear date
                    </Button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <ActionDescriptionEditor
              key={action?.id || (open ? "new" : "closed")}
              value={description}
              onChange={setDescription}
              projectId={projectId}
              disabled={submitting}
              placeholder="Add details, links, or context… · type @ for files & links"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add action"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
