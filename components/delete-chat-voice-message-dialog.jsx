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
import { deleteProjectChatVoiceMessage } from "@/lib/actions/project-chat";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   messageId: string;
 *   durationMs?: number | null;
 *   hasMessageText?: boolean;
 *   onDeleted?: (result: {
 *     deletedEntireMessage: boolean;
 *     messageId: string;
 *     message?: object | null;
 *   }) => void;
 * }} props
 */
export function DeleteChatVoiceMessageDialog({
  open,
  onOpenChange,
  projectId,
  messageId,
  durationMs = null,
  hasMessageText = false,
  onDeleted,
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setBusy(false);
  }, [open, messageId]);

  const handleDelete = async () => {
    setBusy(true);
    const res = await deleteProjectChatVoiceMessage(projectId, messageId);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error || "Could not delete voice message");
      return;
    }
    toast.success(
      res.deletedEntireMessage
        ? "Voice message removed"
        : "Recording deleted — message text kept"
    );
    onDeleted?.({
      deletedEntireMessage: Boolean(res.deletedEntireMessage),
      messageId: res.messageId ?? messageId,
      message: res.message ?? null,
    });
    onOpenChange(false);
  };

  const durationLabel =
    durationMs != null ? formatVoiceNoteDurationLabel(durationMs) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5 text-left">
              <DialogTitle>Delete this voice message?</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">
                {hasMessageText
                  ? "The recording will be permanently removed from storage. The text in this message will stay."
                  : "This removes the voice message from the chat and deletes the audio from storage. This cannot be undone."}
                {durationLabel ? (
                  <>
                    {" "}
                    <span className="text-foreground/80">({durationLabel})</span>
                  </>
                ) : null}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleDelete()}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
