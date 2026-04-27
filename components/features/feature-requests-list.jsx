"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronUp, Lightbulb } from "lucide-react";
import { FeatureDetailDialog } from "./feature-detail-dialog";
import { PersonAvatar } from "./person-avatar";
import { cn } from "@/lib/utils";

function getStatusBadgeClass(status) {
  switch (status) {
    case "In Progress":
      return "bg-orange-100 text-orange-900 border-orange-200/80 dark:bg-orange-950/50 dark:text-orange-100 dark:border-orange-800/60";
    case "Pending":
      return "bg-muted text-foreground border-border";
    case "Approved":
      return "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800/50";
    case "Done":
      return "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-800/50";
    default:
      return "bg-muted text-foreground border-border";
  }
}

function statusAccent(statusDb) {
  switch (statusDb) {
    case "pending":
      return "border-l-slate-400 dark:border-l-slate-500";
    case "approved":
      return "border-l-emerald-500 dark:border-l-emerald-400";
    case "in_progress":
      return "border-l-orange-500";
    case "done":
      return "border-l-violet-500 dark:border-l-violet-400";
    default:
      return "border-l-border";
  }
}

export function FeatureRequestsList({
  requests = [],
  myVoteIds = [],
  filter = "open",
  onVote,
  voteBusyId = null,
}) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const hasVoted = (id) => myVoteIds.includes(id);

  const openFeatures = requests.filter((f) => f.statusDb !== "done");
  const doneFeatures = requests.filter((f) => f.statusDb === "done");
  const displayedFeatures = filter === "open" ? openFeatures : doneFeatures;

  const renderFeatureCard = (feature) => {
    const voted = hasVoted(feature.id);
    const busy = voteBusyId === feature.id;
    const canVote = feature.statusDb !== "done";

    return (
      <Card
        key={feature.id}
        className={cn(
          "group relative cursor-pointer overflow-hidden border-l-[3px] bg-card transition-all duration-150",
          "border border-border/60 shadow-sm hover:border-border hover:shadow-md",
          "focus-within:ring-2 focus-within:ring-ring/30 p-0",
          statusAccent(feature.statusDb)
        )}
        onClick={() => {
          setSelectedFeature(feature);
          setDetailDialogOpen(true);
        }}
      >
        <CardContent className="p-0">
          <div className="flex items-start gap-2.5 p-3 sm:gap-3 sm:p-3.5">
            <PersonAvatar
              name={feature.createdBy}
              avatarUrl={feature.createdByAvatarUrl}
              size="md"
              className="mt-px ring-1 ring-border/40"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-sm font-semibold leading-snug tracking-tight text-balance sm:text-[15px]">
                {feature.title}
              </h3>
              <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                {feature.description || "No description — click to add context in the thread."}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border px-1.5 text-[10px] font-semibold uppercase tracking-wide",
                    getStatusBadgeClass(feature.status)
                  )}
                >
                  {feature.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/85">{feature.createdBy}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary opacity-90 group-hover:opacity-100">
                  Thread
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={busy || voted || !canVote}
              title={!canVote ? "Voting closed for shipped items" : voted ? "You already upvoted" : "Upvote"}
              className={cn(
                "mt-0.5 flex h-auto shrink-0 flex-col items-center gap-0 rounded-lg border border-border/70 bg-muted/30 px-2 py-1.5 transition-all",
                "hover:bg-muted/60",
                voted &&
                  "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                canVote && !voted && "group-hover:border-primary/40 group-hover:bg-orange-500/5"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (canVote && !voted && onVote) onVote(feature.id);
              }}
            >
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              <span className="text-sm font-bold tabular-nums leading-none">
                {busy ? "…" : feature.votes}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">
                {voted ? "You" : "Vote"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {filter === "open" ? "Open ideas" : "Shipped"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {filter === "open"
              ? "Upvote what matters to your workflow. Open a card to read the full story and join the thread."
              : "Features we’ve delivered — thanks for the feedback that helped us get here."}
          </p>
        </div>
        <Badge variant="secondary" className="w-fit shrink-0 px-3 py-1 text-sm tabular-nums">
          {displayedFeatures.length} {displayedFeatures.length === 1 ? "item" : "items"}
        </Badge>
      </div>

      <div className="space-y-2">
        {displayedFeatures.length > 0 ? (
          displayedFeatures.map(renderFeatureCard)
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200/60 bg-gradient-to-b from-orange-50/40 to-muted/20 px-6 py-14 text-center dark:border-orange-900/40 dark:from-orange-950/20 dark:to-muted/10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 ring-8 ring-orange-500/5 dark:bg-orange-500/20 dark:text-orange-400">
              <Lightbulb className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-base font-medium text-foreground">
              {filter === "open" ? "Quiet in here — for now" : "Nothing shipped yet"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {filter === "open"
                ? "Share the first idea using the form on the left. Even a rough note is enough to start the conversation."
                : "When we mark requests as done, they’ll show up in this tab."}
            </p>
          </div>
        )}
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
