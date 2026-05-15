"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { deleteLibraryCommentVoiceNote } from "@/lib/actions/project-library";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";

/**
 * Delete confirmation body (no Dialog wrapper — embed in a parent dialog).
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   commentId: string;
 *   durationMs?: number | null;
 *   hasCommentText?: boolean;
 *   onCancel: () => void;
 *   onDeleted?: (result: { deletedEntireComment: boolean; comment?: object }) => void;
 * }} props
 */
export function DeleteLibraryVoiceNoteConfirm({
  projectId,
  fileId,
  commentId,
  durationMs = null,
  hasCommentText = false,
  onCancel,
  onDeleted,
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(false);
  }, [commentId]);

  const handleDelete = async () => {
    setBusy(true);
    const res = await deleteLibraryCommentVoiceNote(projectId, fileId, commentId);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error || "Could not delete voice note");
      return;
    }
    toast.success(
      res.deletedEntireComment
        ? "Voice note removed"
        : "Recording deleted — comment text kept"
    );
    onDeleted?.({
      deletedEntireComment: Boolean(res.deletedEntireComment),
      comment: res.comment,
    });
  };

  const durationLabel =
    durationMs != null ? formatVoiceNoteDurationLabel(durationMs) : null;

  return (
    <div className="flex flex-col gap-4 p-6 pb-5">
      <DialogHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
          </div>
          <div className="space-y-1.5 text-left">
            <DialogTitle className="text-xl">Delete this voice note?</DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              {hasCommentText
                ? "The recording will be permanently removed from storage and freed from your library quota. The text in this comment will stay."
                : "This removes the voice note from the discussion and deletes the audio from storage. This cannot be undone."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {durationLabel ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
          Recording length: {durationLabel}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          {busy ? "Deleting…" : "Delete recording"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Standalone delete dialog (prefer embedding {@link DeleteLibraryVoiceNoteConfirm} in the parent).
 *
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   fileId: string;
 *   commentId: string | null;
 *   durationMs?: number | null;
 *   hasCommentText?: boolean;
 *   onDeleted?: (result: { deletedEntireComment: boolean; comment?: object }) => void;
 * }} props
 */
export function DeleteLibraryVoiceNoteDialog({
  open,
  onOpenChange,
  projectId,
  fileId,
  commentId,
  durationMs = null,
  hasCommentText = false,
  onDeleted,
}) {
  if (!commentId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden border border-border p-0 shadow-lg sm:max-w-md"
        showCloseButton
      >
        <DeleteLibraryVoiceNoteConfirm
          projectId={projectId}
          fileId={fileId}
          commentId={commentId}
          durationMs={durationMs}
          hasCommentText={hasCommentText}
          onCancel={() => onOpenChange(false)}
          onDeleted={(result) => {
            onOpenChange(false);
            onDeleted?.(result);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
