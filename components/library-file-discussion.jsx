"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addLibraryFileComment, listLibraryFileComments } from "@/lib/actions/project-library";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatCommentTime(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/**
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   fileName?: string;
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 * }}
 */
export function LibraryFileDiscussion({ projectId, fileId, fileName, open, onOpenChange }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setViewer({
        id: user.id,
        name: profile?.full_name?.trim() || user.email?.split("@")[0] || "You",
        avatar: profile?.avatar_url || null,
      });
    })();
  }, [supabase]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    const r = await listLibraryFileComments(String(projectId), String(fileId));
    setLoadingComments(false);
    if (!r.ok) {
      toast.error(r.error || "Could not load comments");
      setComments([]);
      return;
    }
    setComments(r.items || []);
  }, [projectId, fileId]);

  useEffect(() => {
    if (!open) return;
    void loadComments();
  }, [open, loadComments]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, comments]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open || !fileId) return;

    const filter = `file_id=eq.${fileId}`;
    const channel = supabase
      .channel(`library-file-comments:${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_library_file_comments",
          filter,
        },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            const mapped = {
              id: row.id,
              body: row.body,
              author_id: row.author_id,
              author_display_name: row.author_display_name,
              author_avatar_url: row.author_avatar_url,
              created_at: row.created_at,
              optimistic: false,
            };
            const withoutMatchingOptimistic = prev.filter(
              (c) =>
                !(
                  c.optimistic &&
                  c.author_id === mapped.author_id &&
                  c.body === mapped.body
                )
            );
            if (withoutMatchingOptimistic.some((c) => c.id === mapped.id)) {
              return withoutMatchingOptimistic;
            }
            return [...withoutMatchingOptimistic, mapped].sort((a, b) =>
              String(a.created_at).localeCompare(String(b.created_at))
            );
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, fileId, supabase]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || !viewer) return;

    setSending(true);
    const tempId = `local:${crypto.randomUUID()}`;
    const optimisticRow = {
      id: tempId,
      body: text,
      author_id: viewer.id,
      author_display_name: viewer.name,
      author_avatar_url: viewer.avatar,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setDraft("");
    setComments((c) => [...c, optimisticRow]);

    const r = await addLibraryFileComment(String(projectId), String(fileId), text);
    setSending(false);

    if (!r.ok || !r.comment) {
      setComments((c) => c.filter((x) => x.id !== tempId));
      setDraft(text);
      toast.error(r.error || "Could not send comment");
      return;
    }

    setComments((c) =>
      c.map((x) => (x.id === tempId ? { ...r.comment, optimistic: false } : x))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(560px,85vh)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-base">
            {fileName?.trim() ? `Discussion — ${fileName.trim()}` : "File discussion"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Comments are visible to everyone on this project with portal access.
          </DialogDescription>
        </DialogHeader>

        <div ref={listRef} className="min-h-[200px] flex-1 overflow-y-auto px-6 py-4">
          {loadingComments ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments yet. Say something below — it appears right away while it saves.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className={cn("flex gap-2", c.optimistic && "opacity-80")}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={c.author_avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {(c.author_display_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <span className="text-sm font-medium">
                        {c.author_display_name || "Member"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.optimistic ? "Sending…" : formatCommentTime(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-background px-6 py-4">
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              placeholder={viewer ? "Write a comment…" : "Loading profile…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={sending || !viewer}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</p>
              <Button
                type="button"
                size="sm"
                disabled={sending || !viewer || !draft.trim()}
                onClick={() => void handleSend()}
              >
                {sending ? "Sending…" : "Post comment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
