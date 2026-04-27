"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, Clock, Hammer, PartyPopper, ThumbsUp } from "lucide-react";
import { FeatureDetailDialog } from "./feature-detail-dialog";
import { PersonAvatar } from "./person-avatar";
import { cn } from "@/lib/utils";

const COLUMN_META = [
  {
    id: "pending",
    title: "Pending",
    subtitle: "New & waiting for triage",
    Icon: Clock,
    shell: "border-slate-200/90 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40",
    dot: "bg-slate-400",
  },
  {
    id: "approved",
    title: "Approved",
    subtitle: "On the roadmap",
    Icon: ThumbsUp,
    shell: "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/25",
    dot: "bg-emerald-500",
  },
  {
    id: "inProgress",
    title: "In progress",
    subtitle: "We’re building it",
    Icon: Hammer,
    shell: "border-orange-200/90 bg-orange-50/55 dark:border-orange-900/50 dark:bg-orange-950/20",
    dot: "bg-orange-500",
  },
  {
    id: "done",
    title: "Done",
    subtitle: "Shipped to you",
    Icon: PartyPopper,
    shell: "border-violet-200/80 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-950/25",
    dot: "bg-violet-500",
  },
];

function groupRequests(requests) {
  const buckets = {
    pending: [],
    approved: [],
    inProgress: [],
    done: [],
  };
  for (const r of requests) {
    if (r.statusDb === "pending") buckets.pending.push(r);
    else if (r.statusDb === "approved") buckets.approved.push(r);
    else if (r.statusDb === "in_progress") buckets.inProgress.push(r);
    else if (r.statusDb === "done") buckets.done.push(r);
  }
  const sortByVotes = (a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    const tb = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const ta = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  };
  buckets.pending.sort(sortByVotes);
  buckets.approved.sort(sortByVotes);
  buckets.inProgress.sort(sortByVotes);
  buckets.done.sort(sortByVotes);
  return buckets;
}

export function FeatureRoadmap({ requests = [], myVoteIds = [], onVote, voteBusyId = null }) {
  const features = useMemo(() => groupRequests(requests), [requests]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const hasVoted = (id) => myVoteIds.includes(id);

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setDetailDialogOpen(true);
  };

  const renderFeatureCard = (feature) => {
    const voted = hasVoted(feature.id);
    const busy = voteBusyId === feature.id;
    const canVote = feature.statusDb !== "done";

    return (
      <Card
        key={feature.id}
        className="mb-2.5 cursor-pointer border-border/70 bg-background/90 shadow-sm transition-all duration-200 last:mb-0 hover:-translate-y-0.5 hover:shadow-md dark:bg-background/60"
        onClick={() => handleFeatureClick(feature)}
      >
        <CardContent className="flex flex-row items-start gap-2 p-0 px-3 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start gap-2">
              <PersonAvatar
                name={feature.createdBy}
                avatarUrl={feature.createdByAvatarUrl}
                size="sm"
                className="mt-0.5"
              />
              <h4 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{feature.title}</h4>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {feature.description || "No description"}
            </p>
          </div>
          <ButtonVote
            votes={feature.votes}
            voted={voted}
            busy={busy}
            canVote={canVote}
            onVote={(e) => {
              e.stopPropagation();
              if (canVote && !voted && onVote) onVote(feature.id);
            }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight">Roadmap board</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          A simple kanban view of where each idea sits. Columns update as we triage and ship —
          highest votes float to the top inside each stage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_META.map((column) => {
          const list = features[column.id] ?? [];
          const Icon = column.Icon;
          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col rounded-2xl border p-3 shadow-sm backdrop-blur-sm sm:p-4",
                column.shell
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-1 flex h-2 w-2 shrink-0 rounded-full ring-4 ring-background/50",
                      column.dot
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      {column.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{column.subtitle}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-full tabular-nums">
                  {list.length}
                </Badge>
              </div>
              <div className="min-h-[140px] flex-1 space-y-0 overflow-y-auto pr-0.5">
                {list.length > 0 ? (
                  list.map((feature) => renderFeatureCard(feature))
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 py-10 text-center dark:bg-background/20">
                    <p className="px-2 text-xs text-muted-foreground">Drop ideas here later</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <FeatureDetailDialog
        feature={selectedFeature}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onVote={onVote}
        hasVoted={selectedFeature ? hasVoted(selectedFeature.id) : false}
        voteBusyId={voteBusyId}
      />
    </>
  );
}

function ButtonVote({ votes, voted, busy, canVote, onVote }) {
  return (
    <button
      type="button"
      disabled={busy || voted || !canVote}
      title={!canVote ? "Voting closed for shipped items" : voted ? "You upvoted" : "Upvote"}
      onClick={onVote}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2.5 py-2 text-sm transition-all",
        voted
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-input bg-background/90 hover:bg-muted hover:shadow-sm",
        canVote && !voted && "active:scale-95"
      )}
    >
      <ChevronUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      <span className="text-sm font-bold tabular-nums">{busy ? "…" : votes}</span>
    </button>
  );
}
