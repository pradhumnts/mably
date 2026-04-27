"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { addFeatureRequestComment, listFeatureRequestComments } from "@/lib/actions/feature-requests";
import { PersonAvatar } from "./person-avatar";
import { cn } from "@/lib/utils";

function getStatusColor(status) {
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

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function FeatureDetailDialog({
  feature,
  open,
  onOpenChange,
  onVote,
  hasVoted,
  voteBusyId = null,
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadComments = useCallback(async (id) => {
    setCommentsLoading(true);
    try {
      const res = await listFeatureRequestComments(id);
      if (!res.ok) {
        setComments([]);
        return;
      }
      setComments(res.comments);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !feature?.id) {
      setComments([]);
      setComment("");
      return;
    }
    loadComments(feature.id);
  }, [open, feature?.id, loadComments]);

  if (!feature) return null;

  const busyVote = voteBusyId === feature.id;
  const canVote = feature.statusDb !== "done";

  const handleVote = () => {
    if (canVote && onVote) onVote(feature.id);
  };

  const handleSubmitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setCommentSubmitting(true);
    try {
      const res = await addFeatureRequestComment(feature.id, text);
      if (!res.ok) {
        toast.error("Could not post comment", { description: res.error });
        return;
      }
      toast.success("Posted");
      setComment("");
      await loadComments(feature.id);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden border-border/80 p-0 sm:rounded-2xl">
        <div className="relative overflow-hidden border-b border-orange-200/30 bg-gradient-to-br from-orange-50/90 via-background to-violet-50/40 px-6 pb-5 pt-6 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20">
          <div
            className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-orange-400/20 blur-2xl"
            aria-hidden
          />
          <DialogHeader className="relative space-y-3 text-left">
            <DialogTitle className="pr-8 text-xl font-semibold leading-snug tracking-tight">
              {feature.title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={busyVote || hasVoted || !canVote}
                title={!canVote ? "Voting closed for shipped items" : undefined}
                className={cn(
                  "h-auto gap-1.5 rounded-xl px-4 py-2.5 shadow-sm",
                  hasVoted && "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleVote}
              >
                <ChevronUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                <span className="font-bold tabular-nums">{busyVote ? "…" : feature.votes}</span>
                <span className="text-xs font-medium opacity-90">
                  {hasVoted ? "You upvoted" : canVote ? "Upvote" : "Shipped"}
                </span>
              </Button>
              <Badge variant="outline" className={cn("font-medium", getStatusColor(feature.status))}>
                {feature.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <PersonAvatar
                name={feature.createdBy}
                avatarUrl={feature.createdByAvatarUrl}
                size="sm"
              />
              <span>
                <span className="font-medium text-foreground">{feature.createdBy}</span>
                <span className="mx-1.5 text-border">·</span>
                {formatDate(feature.createdAt)}
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[min(60vh,520px)] space-y-5 overflow-y-auto px-6 py-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {feature.description || "No description provided."}
          </p>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
              <FieldLabel className="text-sm font-semibold">Discussion</FieldLabel>
            </div>
            <Textarea
              placeholder="Add context, edge cases, or a +1 with more detail…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={commentSubmitting}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="rounded-full px-5"
                onClick={handleSubmitComment}
                disabled={!comment.trim() || commentSubmitting}
              >
                {commentSubmitting ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {commentsLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading thread…</p>
            ) : comments.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No replies yet</p>
                <p className="mt-1 px-4 text-xs text-muted-foreground">
                  Be the first to add context — good threads make features better.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="flex gap-3 rounded-xl border border-border/60 bg-card/60 p-3 shadow-sm dark:bg-card/40"
                  >
                    <PersonAvatar name={c.authorName} avatarUrl={c.authorAvatarUrl} size="default" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">{c.authorName}</span>
                        <time className="text-[11px] text-muted-foreground" dateTime={c.createdAt}>
                          {formatDate(c.createdAt)}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
