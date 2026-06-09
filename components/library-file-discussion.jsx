"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addLibraryFileComment,
  getLibraryFileDownloadUrl,
  listLibraryFileComments,
} from "@/lib/actions/project-library";
import { postLibraryFilesComment } from "@/lib/client/post-library-files-comment";
import { postLibraryVoiceComment } from "@/lib/client/post-library-voice-comment";
import { MAX_DISCUSSION_COMMENT_FILES } from "@/lib/library/discussion-file-attachments";
import { LibraryDiscussionAttachedFiles } from "@/components/library-discussion-attached-files";
import { LibraryDiscussionPendingFiles } from "@/components/library-discussion-pending-files";
import {
  STARTER_LIBRARY_MAX_FILE_BYTES,
  STARTER_LIBRARY_MAX_FILE_LABEL,
} from "@/lib/billing/library-storage-policy";
import { inferFileKindFromMime } from "@/lib/library/infer-types";
import { mapAttachedLibraryFile } from "@/lib/library/map-attached-file";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LibraryVoiceNotePlayer } from "@/components/library-voice-note-player";
import { useLibraryVoiceComposerState } from "@/components/library-voice-composer";
import { DeleteLibraryVoiceNoteConfirm } from "@/components/delete-library-voice-note-dialog";
import { LibraryVoiceMessageDeleted } from "@/components/library-voice-message-deleted";
import { isDemoVoiceNoteStoragePath } from "@/lib/library/demo-voice-note";
import { usePortalBrand, usePortalBrandSurfaceStyles } from "@/components/portal-brand";
import { LinkifiedText } from "@/components/linkified-text";

/** @param {object} comment */
function mapCommentAfterVoiceRemoval(comment) {
  return {
    ...comment,
    voice_note_storage_path: null,
    voice_note_duration_ms: null,
    voice_note_mime_type: null,
    voice_note_size_bytes: null,
    voice_note_waveform: null,
    voice_note_transcript: null,
    voice_note_listened: false,
    voice_message_deleted: true,
  };
}

/**
 * @param {object} comment
 * @param {Record<string, string> | undefined} fileDisplayNameById
 */
function getCommentAttachedFiles(comment, fileDisplayNameById) {
  let files = [];
  if (Array.isArray(comment.attached_files) && comment.attached_files.length) {
    files = comment.attached_files;
  } else if (comment.attached_file) {
    files = [comment.attached_file];
  }
  if (!fileDisplayNameById || !files.length) return files;
  return files.map((file) => {
    const override = fileDisplayNameById[String(file.id)];
    return override ? { ...file, display_name: override } : file;
  });
}

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
 *   fileLogo?: string | null;
 *   uploadedByName?: string | null;
 *   uploadedByAvatar?: string | null;
 *   uploadedAt?: string | null;
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   isFreelancer?: boolean;
 *   maxFileBytes?: number;
 *   maxFileLabel?: string;
 *   onLibraryChanged?: () => void;
 *   fileDisplayNameById?: Record<string, string>;
 *   onPreviewAttachedFile?: (file: {
 *     fileId: string;
 *     name: string;
 *     type: string;
 *     mimeType: string | null;
 *   }) => void;
 * }}
 */
export function LibraryFileDiscussion({
  projectId,
  fileId,
  fileName,
  fileLogo = null,
  uploadedByName = null,
  uploadedByAvatar = null,
  uploadedAt = null,
  open,
  onOpenChange,
  isFreelancer = false,
  maxFileBytes = STARTER_LIBRARY_MAX_FILE_BYTES,
  maxFileLabel = STARTER_LIBRARY_MAX_FILE_LABEL,
  onLibraryChanged,
  fileDisplayNameById,
  onPreviewAttachedFile,
}) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState(null);
  /** @type {[null | { blob: Blob; waveform: number[] | null; durationMs: number }, React.Dispatch<any>]} */
  const [pendingVoice, setPendingVoice] = useState(null);
  /** @type {[Record<string, { phase: "preparing" | "uploading" | "saving"; percent: number }>, React.Dispatch<any>]} */
  const [voiceUploadById, setVoiceUploadById] = useState({});
  /** @type {[null | { commentId: string; durationMs: number; hasCommentText: boolean }, React.Dispatch<any>]} */
  const [deleteVoiceTarget, setDeleteVoiceTarget] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(/** @type {File[]} */ ([]));
  const [fileLimitSkipped, setFileLimitSkipped] = useState(0);
  const [needsApproval, setNeedsApproval] = useState(false);
  /** @type {[Record<string, { phase: "preparing" | "uploading" | "saving"; percent: number; currentIndex?: number; totalFiles?: number; fileName?: string }>, React.Dispatch<any>]} */
  const [fileUploadById, setFileUploadById] = useState({});
  const { brandCss } = usePortalBrand();
  const brandSurface = usePortalBrandSurfaceStyles();
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const supabase = useMemo(() => createClient(), []);

  const voiceComposer = useLibraryVoiceComposerState({
    disabled: sending || !viewer || pendingFiles.length > 0,
    micDisabledLabel: pendingFiles.length > 0 ? "Remove files to record a voice note" : undefined,
    pendingVoice,
    onRecorded: (recording) => {
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPendingVoice(recording);
    },
    onClear: () => setPendingVoice(null),
  });

  useEffect(() => {
    if (!open) setDeleteVoiceTarget(null);
  }, [open]);

  const handleDialogOpenChange = (next) => {
    if (!next) {
      if (deleteVoiceTarget) {
        setDeleteVoiceTarget(null);
        return;
      }
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
  };

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
    if (!open) {
      setPendingVoice(null);
      setPendingFiles([]);
      setFileLimitSkipped(0);
      setNeedsApproval(false);
      setDraft("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

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

          void (async () => {
            /** @type {string[]} */
            let fileIds = [];
            const { data: junctionRows } = await supabase
              .from("project_library_file_comment_attachments")
              .select("file_id, sort_order")
              .eq("comment_id", row.id)
              .order("sort_order", { ascending: true });
            if (junctionRows?.length) {
              fileIds = junctionRows.map((link) => String(link.file_id));
            } else if (row.attached_file_id) {
              fileIds = [String(row.attached_file_id)];
            }

            let attached_files = [];
            if (fileIds.length) {
              const { data: fileRows } = await supabase
                .from("project_library_files")
                .select("id, display_name, mime_type, original_filename")
                .in("id", fileIds);
              const byId = new Map(
                (fileRows ?? []).map((fileRow) => [
                  String(fileRow.id),
                  mapAttachedLibraryFile(fileRow),
                ])
              );
              attached_files = fileIds.map((id) => byId.get(id)).filter(Boolean);
            }

            const mapped = {
              id: row.id,
              body: row.body,
              author_id: row.author_id,
              author_display_name: row.author_display_name,
              author_avatar_url: row.author_avatar_url,
              created_at: row.created_at,
              voice_note_storage_path: row.voice_note_storage_path ?? null,
              voice_note_duration_ms: row.voice_note_duration_ms ?? null,
              voice_note_mime_type: row.voice_note_mime_type ?? null,
              voice_note_size_bytes: row.voice_note_size_bytes ?? null,
              voice_note_waveform: row.voice_note_waveform ?? null,
              voice_note_transcript: row.voice_note_transcript ?? null,
              voice_note_listened: false,
              attached_file_id: row.attached_file_id ?? null,
              attached_files,
              attached_file: attached_files[0] ?? null,
              optimistic: false,
            };

            setComments((prev) => {
              if (prev.some((c) => c.id === mapped.id)) {
                return prev.map((c) => {
                  if (c.id !== mapped.id) return c;
                  const hasLocalAttachments = getCommentAttachedFiles(c).length > 0;
                  if (!hasLocalAttachments && attached_files.length) {
                    return {
                      ...c,
                      attached_files,
                      attached_file: mapped.attached_file,
                      attached_file_id: mapped.attached_file_id,
                    };
                  }
                  return c;
                });
              }

              const withoutMatchingOptimistic = prev.filter((c) => {
                if (!c.optimistic || c.author_id !== mapped.author_id) return true;
                if (attached_files.length && c.attached_file_id === "pending") return false;
                return c.body !== mapped.body;
              });

              if (withoutMatchingOptimistic.some((c) => c.id === mapped.id)) {
                return withoutMatchingOptimistic;
              }

              return [...withoutMatchingOptimistic, mapped].sort((a, b) =>
                String(a.created_at).localeCompare(String(b.created_at))
              );
            });
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, fileId, supabase]);

  const canSend =
    Boolean(viewer) &&
    !sending &&
    !voiceComposer.recording &&
    !voiceComposer.processing &&
    (draft.trim() || pendingVoice || pendingFiles.length > 0);

  const handlePickFile = (event) => {
    const input = event.target;
    const picked = [...(input.files ?? [])];
    if (!picked.length) return;
    input.value = "";

    const accepted = [];
    const tooLarge = [];
    for (const file of picked) {
      if (file.size > maxFileBytes) {
        tooLarge.push(file);
        continue;
      }
      accepted.push(file);
    }

    if (tooLarge.length) {
      const first = tooLarge[0];
      const mb = (first.size / (1024 * 1024)).toFixed(1);
      toast.error(tooLarge.length === 1 ? "File too large" : `${tooLarge.length} files too large`, {
        description:
          tooLarge.length === 1
            ? `${first.name} is about ${mb} MB. The maximum upload size is ${maxFileLabel}.`
            : `Each file must be under ${maxFileLabel}. Skipped: ${tooLarge.map((f) => f.name).join(", ")}`,
      });
    }

    if (!accepted.length) return;

    setPendingFiles((prev) => {
      const next = [...prev, ...accepted];
      if (next.length > MAX_DISCUSSION_COMMENT_FILES) {
        setFileLimitSkipped(next.length - MAX_DISCUSSION_COMMENT_FILES);
        return next.slice(0, MAX_DISCUSSION_COMMENT_FILES);
      }
      setFileLimitSkipped(0);
      return next;
    });
    setPendingVoice(null);
    if (picked.length > 1 || pendingFiles.length > 0) {
      setNeedsApproval(false);
    }
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length !== 1) setNeedsApproval(false);
      if (next.length < MAX_DISCUSSION_COMMENT_FILES) setFileLimitSkipped(0);
      return next;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const atFileLimit = pendingFiles.length >= MAX_DISCUSSION_COMMENT_FILES;
  const fileLimitCaption =
    atFileLimit || fileLimitSkipped > 0
      ? [
          `Maximum ${MAX_DISCUSSION_COMMENT_FILES} files per comment.`,
          fileLimitSkipped > 0
            ? `${fileLimitSkipped} extra file${fileLimitSkipped === 1 ? "" : "s"} were not added.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  const attachDisabled =
    sending ||
    !viewer ||
    Boolean(pendingVoice) ||
    voiceComposer.recording ||
    atFileLimit;

  const handleDownloadAttached = async (attachedFile) => {
    const r = await getLibraryFileDownloadUrl(String(projectId), String(attachedFile.id));
    if (!r.ok || !r.url) {
      toast.error(r.error || "Could not download file");
      return;
    }
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const handleSend = async () => {
    const text = draft.trim();
    const voice = pendingVoice;
    const files = [...pendingFiles];
    if ((!text && !voice && !files.length) || sending || !viewer) return;

    setSending(true);
    const tempId = `local:${crypto.randomUUID()}`;
    const optimisticAttachedFiles = files.map((file) => ({
      id: "pending",
      display_name: file.name,
      type: inferFileKindFromMime(file.type, file.name),
      mime_type: file.type || null,
    }));
    const optimisticRow = {
      id: tempId,
      body: text || null,
      author_id: viewer.id,
      author_display_name: viewer.name,
      author_avatar_url: viewer.avatar,
      created_at: new Date().toISOString(),
      voice_note_storage_path: voice ? "pending" : null,
      voice_note_duration_ms: voice?.durationMs ?? null,
      voice_note_waveform: voice?.waveform ?? null,
      voice_note_local_blob: voice?.blob ?? null,
      attached_file_id: files.length ? "pending" : null,
      attached_files: optimisticAttachedFiles,
      attached_file: optimisticAttachedFiles[0] ?? null,
      optimistic: true,
    };

    const approvalForUpload = isFreelancer && needsApproval && files.length === 1;

    setDraft("");
    setPendingVoice(null);
    setPendingFiles([]);
    setNeedsApproval(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setComments((c) => [...c, optimisticRow]);

    let r;
    if (files.length) {
      setFileUploadById((m) => ({
        ...m,
        [tempId]: {
          phase: "preparing",
          percent: 0,
          currentIndex: 1,
          totalFiles: files.length,
          fileName: files[0]?.name || "File",
        },
      }));
      r = await postLibraryFilesComment({
        projectId: String(projectId),
        fileId: String(fileId),
        body: text,
        files,
        needsApproval: approvalForUpload,
        onProgress: (s) => setFileUploadById((m) => ({ ...m, [tempId]: s })),
      });
      if (r.ok) {
        requestAnimationFrame(() => onLibraryChanged?.());
      }
    } else if (voice) {
      setVoiceUploadById((m) => ({ ...m, [tempId]: { phase: "preparing", percent: 0 } }));
      r = await postLibraryVoiceComment({
        projectId: String(projectId),
        fileId: String(fileId),
        body: text,
        blob: voice.blob,
        waveform: voice.waveform,
        durationMs: voice.durationMs,
        mimeType: voice.blob.type,
        onProgress: (s) => setVoiceUploadById((m) => ({ ...m, [tempId]: s })),
      });
    } else {
      r = await addLibraryFileComment(String(projectId), String(fileId), text);
    }
    setSending(false);

    if (!r.ok || !r.comment) {
      setComments((c) => c.filter((x) => x.id !== tempId));
      setVoiceUploadById((m) => {
        const next = { ...m };
        delete next[tempId];
        return next;
      });
      setFileUploadById((m) => {
        const next = { ...m };
        delete next[tempId];
        return next;
      });
      setDraft(text);
      if (voice) setPendingVoice(voice);
      if (files.length) setPendingFiles(files);
      toast.error(r.error || "Could not send", {
        description:
          r.failed?.length && r.succeeded?.length
            ? `${r.succeeded.length} uploaded, ${r.failed.length} failed: ${r.failed.map((f) => f.fileName).join(", ")}`
            : r.failed?.length
              ? r.failed.map((f) => `${f.fileName}: ${f.error || "failed"}`).join(" · ")
              : undefined,
      });
      return;
    }

    if (r.failed?.length) {
      toast.warning(
        r.succeeded?.length === 1
          ? "1 file uploaded"
          : `${r.succeeded?.length ?? 0} files uploaded`,
        {
          description: `${r.failed.length} could not be uploaded: ${r.failed.map((f) => f.fileName).join(", ")}`,
        }
      );
    }

    setVoiceUploadById((m) => {
      const next = { ...m };
      delete next[tempId];
      return next;
    });
    setFileUploadById((m) => {
      const next = { ...m };
      delete next[tempId];
      return next;
    });
    setComments((c) =>
      c.map((x) => (x.id === tempId ? { ...r.comment, optimistic: false } : x))
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        style={brandCss ?? undefined}
        data-portal-brand={brandCss ? "" : undefined}
        className={cn(
          "flex w-full max-w-[min(640px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:max-w-[640px]",
          deleteVoiceTarget ? "h-auto" : "h-[min(700px,85vh)]"
        )}
      >
        {deleteVoiceTarget ? (
          <DeleteLibraryVoiceNoteConfirm
            projectId={String(projectId)}
            fileId={String(fileId)}
            commentId={deleteVoiceTarget.commentId}
            durationMs={deleteVoiceTarget.durationMs}
            hasCommentText={deleteVoiceTarget.hasCommentText}
            onCancel={() => setDeleteVoiceTarget(null)}
            onDeleted={(result) => {
              const id = deleteVoiceTarget.commentId;
              const hadText = deleteVoiceTarget.hasCommentText;
              setDeleteVoiceTarget(null);
              if (result.deletedEntireComment) {
                setComments((list) => list.filter((x) => x.id !== id));
              } else if (hadText) {
                setComments((list) =>
                  list.map((x) =>
                    x.id === id
                      ? mapCommentAfterVoiceRemoval(result.comment ?? x)
                      : x
                  )
                );
              }
            }}
          />
        ) : (
          <>
        <div
          className={cn(
            "relative shrink-0 overflow-visible px-6 py-4",
            !brandSurface && "portal-brand-surface"
          )}
          style={brandSurface?.surface}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full blur-2xl",
              !brandSurface && "portal-brand-glow"
            )}
            style={brandSurface?.glow}
          />
          <DialogHeader className="relative space-y-0 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/85 p-2">
                {fileLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileLogo} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="h-5 w-5 rounded bg-muted" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate pr-8 text-base font-semibold">
                  {fileName?.trim() || "File discussion"}
                </DialogTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={uploadedByAvatar || undefined} alt={uploadedByName || "Uploader"} />
                    <AvatarFallback className="text-[10px]">
                      {(uploadedByName || "M").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Uploaded by{" "}
                    <span className="font-medium text-foreground">{uploadedByName || "Member"}</span>
                    {uploadedAt ? (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        {uploadedAt}
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loadingComments ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
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
                    <div className="mt-2 space-y-2">
                      {c.voice_message_deleted ? (
                        <LibraryVoiceMessageDeleted />
                      ) : c.voice_note_storage_path &&
                        c.voice_note_duration_ms &&
                        c.voice_note_storage_path !== "pending" ? (
                        <LibraryVoiceNotePlayer
                          projectId={String(projectId)}
                          fileId={String(fileId)}
                          commentId={String(c.id)}
                          durationMs={Number(c.voice_note_duration_ms)}
                          waveform={
                            Array.isArray(c.voice_note_waveform) ? c.voice_note_waveform : null
                          }
                          transcript={c.voice_note_transcript || null}
                          listened={Boolean(c.voice_note_listened)}
                          localBlob={c.voice_note_local_blob ?? null}
                          uploadState={
                            c.voice_note_storage_path === "pending"
                              ? voiceUploadById[c.id] ?? { phase: "preparing", percent: 0 }
                              : null
                          }
                          canDelete={
                            Boolean(
                              viewer &&
                                !isDemoVoiceNoteStoragePath(c.voice_note_storage_path) &&
                                c.voice_note_storage_path !== "pending" &&
                                !c.optimistic &&
                                (c.author_id === viewer.id || isFreelancer)
                            )
                          }
                          onRequestDelete={() =>
                            setDeleteVoiceTarget({
                              commentId: String(c.id),
                              durationMs: Number(c.voice_note_duration_ms),
                              hasCommentText: Boolean(c.body?.trim()),
                            })
                          }
                          demoPreview={isDemoVoiceNoteStoragePath(c.voice_note_storage_path)}
                        />
                      ) : null}
                      {c.attached_file_id === "pending" ||
                      getCommentAttachedFiles(c, fileDisplayNameById).length ? (
                        <div className="space-y-1.5">
                          {c.attached_file_id === "pending" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <FileUp className="h-4 w-4 shrink-0 animate-pulse" aria-hidden />
                              {fileUploadById[c.id]?.totalFiles && fileUploadById[c.id].totalFiles > 1
                                ? `Uploading ${fileUploadById[c.id].currentIndex ?? 1} of ${fileUploadById[c.id].totalFiles}`
                                : "Uploading file"}
                              {fileUploadById[c.id]?.fileName
                                ? `: ${fileUploadById[c.id].fileName}`
                                : ""}
                              {fileUploadById[c.id]?.percent
                                ? ` · ${fileUploadById[c.id].percent}%`
                                : "…"}
                            </div>
                          ) : (
                            <LibraryDiscussionAttachedFiles
                              attachedFiles={getCommentAttachedFiles(c, fileDisplayNameById)}
                              onPreview={onPreviewAttachedFile ?? undefined}
                              onDownload={(file) => void handleDownloadAttached(file)}
                            />
                          )}
                        </div>
                      ) : null}
                      {c.body?.trim() ? (
                        <LinkifiedText
                          text={c.body}
                          className="text-sm whitespace-pre-wrap break-words"
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-0 shrink-0 flex-col border-t border-border bg-background">
          {voiceComposer.panel || pendingFiles.length ? (
            <div className="max-h-40 min-h-0 space-y-2 overflow-y-auto px-6 pt-3">
              {voiceComposer.panel}
              {pendingFiles.length ? (
                <LibraryDiscussionPendingFiles
                  files={pendingFiles}
                  disabled={sending}
                  onRemove={removePendingFile}
                />
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-2.5 px-6 py-4">
            {isFreelancer && pendingFiles.length === 1 ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`discussion-needs-approval-${fileId}`}
                  checked={needsApproval}
                  disabled={sending}
                  onCheckedChange={(checked) => setNeedsApproval(checked === true)}
                />
                <Label
                  htmlFor={`discussion-needs-approval-${fileId}`}
                  className="text-sm font-normal text-muted-foreground"
                >
                  Request client approval for this file
                </Label>
              </div>
            ) : null}
            <Textarea
              ref={textareaRef}
              placeholder={viewer ? "Write a comment…" : "Loading profile…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={pendingFiles.length || pendingVoice ? 2 : 3}
              className="resize-none text-sm"
              disabled={sending || !viewer || voiceComposer.recording || voiceComposer.processing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void handleSend();
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              disabled={sending || !viewer || voiceComposer.recording || voiceComposer.processing}
              onChange={handlePickFile}
            />
            {fileLimitCaption ? (
              <p className="text-xs text-muted-foreground" role="status">
                {fileLimitCaption}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!pendingVoice && !voiceComposer.recording ? voiceComposer.micButton : null}
                {!pendingVoice && !voiceComposer.recording ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          aria-label={
                            pendingFiles.length
                              ? `Add more files (${pendingFiles.length}/${MAX_DISCUSSION_COMMENT_FILES})`
                              : "Attach files"
                          }
                          disabled={attachDisabled}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" aria-hidden />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {atFileLimit
                        ? `Maximum ${MAX_DISCUSSION_COMMENT_FILES} files per comment`
                        : pendingFiles.length > 0
                          ? `Add more files (${pendingFiles.length}/${MAX_DISCUSSION_COMMENT_FILES})`
                          : "Attach files"}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={!canSend}
                onClick={() => void handleSend()}
              >
                <Send className="h-4 w-4" aria-hidden />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}