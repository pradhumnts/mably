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
import { deleteLibraryFile, deleteLibraryLink } from "@/lib/actions/project-library";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   kind: "file" | "link";
 *   item: { id: string; label: string } | null;
 *   onDeleted?: () => void;
 * }}
 */
export function DeleteLibraryItemDialog({ open, onOpenChange, projectId, kind, item, onDeleted }) {
  const [busy, setBusy] = useState(false);

  const label = (item?.label ?? "").trim() || (kind === "file" ? "this file" : "this link");

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  const handleDelete = async () => {
    if (!item?.id) return;
    setBusy(true);
    const res =
      kind === "file"
        ? await deleteLibraryFile(projectId, item.id)
        : await deleteLibraryLink(projectId, item.id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error || "Could not remove item");
      return;
    }
    toast.success(kind === "file" ? "File deleted" : "Link removed");
    onOpenChange(false);
    onDeleted?.();
  };

  if (!item) return null;

  const title = kind === "file" ? "Delete this file?" : "Remove this link?";
  const detail =
    kind === "file"
      ? "This removes the file from your library and storage. Anyone with portal access will no longer be able to download it. This cannot be undone."
      : "This removes the link from the project library. This cannot be undone.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5 text-left">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">{detail}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm font-medium text-foreground border border-border rounded-md bg-muted/40 px-3 py-2">
          {kind === "file" ? "File" : "Link"}: <span className="font-mono break-all">{label}</span>
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            {busy ? "Removing…" : kind === "file" ? "Delete file" : "Remove link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
