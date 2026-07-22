"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  format,
  isThisYear,
} from "date-fns";
import { CheckSquare2, Plus, Trash2 } from "lucide-react";
import { usePortalProject } from "../project-portal-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateActionDialog } from "@/components/actions/create-action-dialog";
import { ViewActionDialog } from "@/components/actions/view-action-dialog";
import { stripActionDescriptionHtml } from "@/components/actions/action-description-editor";
import {
  listProjectActions,
  setProjectActionStatus,
  deleteProjectAction,
} from "@/lib/actions/project-actions";
import {
  stickyPageHeaderClass,
  stickyPageHeaderInnerClass,
  pageContentNarrowClass,
  pageHeaderNavDividerClass,
} from "@/lib/ui/page-chrome";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * @param {string | null} due
 */
function formatDue(due) {
  if (!due) return null;
  const d = parseISO(due);
  if (Number.isNaN(d.getTime())) return null;
  if (isToday(d)) return "Today";
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

/**
 * @param {string | null} due
 */
function dueTone(due) {
  if (!due) return "muted";
  const d = startOfDay(parseISO(due));
  if (Number.isNaN(d.getTime())) return "muted";
  const today = startOfDay(new Date());
  if (isBefore(d, today)) return "overdue";
  if (isToday(d)) return "today";
  return "upcoming";
}

/**
 * @param {Array<{
 *   id: string;
 *   title: string;
 *   notes: string;
 *   owner: "freelancer" | "client";
 *   dueDate: string | null;
 *   status: "open" | "done";
 *   completedAt: string | null;
 * }>} rows
 */
function sortOpen(rows) {
  const today = startOfDay(new Date()).getTime();
  return [...rows].sort((a, b) => {
    const aDue = a.dueDate ? startOfDay(parseISO(a.dueDate)).getTime() : null;
    const bDue = b.dueDate ? startOfDay(parseISO(b.dueDate)).getTime() : null;
    if (aDue == null && bDue == null) return 0;
    if (aDue == null) return 1;
    if (bDue == null) return -1;
    const aOver = aDue < today ? 0 : 1;
    const bOver = bDue < today ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    return aDue - bDue;
  });
}

/**
 * @param {{
 *   row: {
 *     id: string;
 *     title: string;
 *     notes: string;
 *     owner: "freelancer" | "client";
 *     visibility?: string;
 *     dueDate: string | null;
 *     status: "open" | "done";
 *   };
 *   isFreelancer: boolean;
 *   busy: boolean;
 *   onToggle: () => void;
 *   onOpen?: () => void;
 *   onDelete?: () => void;
 * }} props
 */
function ActionRow({ row, isFreelancer, busy, onToggle, onOpen, onDelete }) {
  const dueLabel = formatDue(row.dueDate);
  const tone = dueTone(row.dueDate);
  const checked = row.status === "done";
  const canToggle =
    isFreelancer || (row.owner === "client" && row.visibility !== "private");
  const canOpen = Boolean(onOpen);

  return (
    <li
      className={cn(
        "group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
        checked ? "opacity-60" : "hover:bg-muted/40",
        canOpen && "cursor-pointer"
      )}
      onClick={() => {
        if (canOpen) onOpen();
      }}
      onKeyDown={(e) => {
        if (!canOpen) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
    >
      <div
        className="mt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={checked}
          disabled={!canToggle || busy}
          onCheckedChange={() => {
            if (canToggle) onToggle();
          }}
          aria-label={checked ? "Mark open" : "Mark complete"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground",
            checked && "line-through"
          )}
        >
          {row.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {isFreelancer ? (
            <span>
              {row.owner === "client" ? "Waiting on client" : "For me"}
            </span>
          ) : null}
          {dueLabel ? (
            <>
              {isFreelancer ? <span aria-hidden>·</span> : null}
              <span
                className={cn(
                  tone === "overdue" && !checked && "font-medium text-rose-600",
                  tone === "today" && !checked && "font-medium text-orange-700"
                )}
              >
                {tone === "overdue" && !checked
                  ? `Overdue · ${dueLabel}`
                  : dueLabel}
              </span>
            </>
          ) : null}
          {row.notes?.trim() && !checked ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">
                {stripActionDescriptionHtml(row.notes)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      {isFreelancer && onDelete ? (
        <div
          className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy}
            onClick={onDelete}
            aria-label="Delete action"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export default function ProjectActionsPage() {
  const params = useParams();
  const projectId = String(params.projectId || "");
  const { sidebar, meta } = usePortalProject();
  const isFreelancer = Boolean(meta?.isFreelancer);

  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingAction, setViewingAction] = useState(/** @type {any | null} */ (null));
  const [editingAction, setEditingAction] = useState(/** @type {any | null} */ (null));
  const [busyId, setBusyId] = useState(/** @type {string | null} */ (null));

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await listProjectActions(projectId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error || "Could not load actions");
      setRows([]);
      return;
    }
    setRows(res.rows);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openRows = useMemo(
    () => sortOpen(rows.filter((r) => r.status === "open")),
    [rows]
  );
  const doneRows = useMemo(
    () =>
      [...rows.filter((r) => r.status === "done")].sort((a, b) =>
        String(b.completedAt || "").localeCompare(String(a.completedAt || ""))
      ),
    [rows]
  );

  const waitingCount = openRows.filter((r) => r.owner === "client").length;

  const onToggle = async (row) => {
    const next = row.status === "done" ? "open" : "done";
    setBusyId(row.id);
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: next,
              completedAt: next === "done" ? new Date().toISOString() : null,
            }
          : r
      )
    );
    const res = await setProjectActionStatus(projectId, row.id, { status: next });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error || "Could not update");
      void load();
      return;
    }
    if (res.row) {
      setRows((prev) => prev.map((r) => (r.id === res.row.id ? res.row : r)));
    }
  };

  const onDelete = async (row) => {
    setBusyId(row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    const res = await deleteProjectAction(projectId, row.id);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error || "Could not delete");
      void load();
    }
  };

  return (
    <>
      <header className={stickyPageHeaderClass}>
        <div className={stickyPageHeaderInnerClass}>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className={pageHeaderNavDividerClass} />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>
                  {sidebar.projectName || "Project"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Actions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isFreelancer ? (
            <Button
              type="button"
              size="sm"
              className="ml-auto rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add action
            </Button>
          ) : null}
        </div>
      </header>

      <div className={pageContentNarrowClass}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Actions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFreelancer
              ? waitingCount > 0
                ? `${waitingCount} waiting on client · Keep deadlines and follow-ups here.`
                : "Keep client deadlines and follow-ups here."
              : "Things we need from you to keep the project moving."}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-muted/70"
              />
            ))}
          </div>
        ) : openRows.length === 0 && doneRows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckSquare2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isFreelancer ? "No actions yet" : "Nothing needed from you right now"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {isFreelancer
                ? "Add a deadline, follow-up, or something you’re waiting on from the client."
                : "When your freelancer shares an action with you, it will show up here."}
            </p>
            {isFreelancer ? (
              <Button
                type="button"
                className="mt-5 rounded-full"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add action
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            {openRows.length > 0 ? (
              <section>
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Open
                </h2>
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
                  {openRows.map((row) => (
                    <ActionRow
                      key={row.id}
                      row={row}
                      isFreelancer={isFreelancer}
                      busy={busyId === row.id}
                      onToggle={() => void onToggle(row)}
                      onOpen={() => setViewingAction(row)}
                      onDelete={isFreelancer ? () => void onDelete(row) : undefined}
                    />
                  ))}
                </ul>
              </section>
            ) : (
              <p className="px-1 text-sm text-muted-foreground">
                No open actions.
              </p>
            )}

            {doneRows.length > 0 ? (
              <section>
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Completed
                </h2>
                <ul className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-muted/20">
                  {doneRows.map((row) => (
                    <ActionRow
                      key={row.id}
                      row={row}
                      isFreelancer={isFreelancer}
                      busy={busyId === row.id}
                      onToggle={() => void onToggle(row)}
                      onOpen={() => setViewingAction(row)}
                      onDelete={isFreelancer ? () => void onDelete(row) : undefined}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <ViewActionDialog
        open={Boolean(viewingAction)}
        onOpenChange={(open) => {
          if (!open) setViewingAction(null);
        }}
        projectId={projectId}
        action={viewingAction}
        canEdit={isFreelancer}
        onEdit={() => {
          const row = viewingAction;
          setViewingAction(null);
          if (row) setEditingAction(row);
        }}
      />

      {isFreelancer ? (
        <>
          <CreateActionDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            projectId={projectId}
            onSaved={() => void load()}
          />
          <CreateActionDialog
            open={Boolean(editingAction)}
            onOpenChange={(open) => {
              if (!open) setEditingAction(null);
            }}
            projectId={projectId}
            action={editingAction}
            onSaved={() => {
              setEditingAction(null);
              void load();
            }}
          />
        </>
      ) : null}
    </>
  );
}
