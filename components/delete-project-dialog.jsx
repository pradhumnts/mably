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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteProject } from "@/lib/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy } from "lucide-react";

/**
 * @param {{ open: boolean; onOpenChange: (open: boolean) => void; project: { id: string; name: string } | null }}
 */
export function DeleteProjectDialog({ open, onOpenChange, project }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = (project?.name ?? "").trim();
  const fallbackPhrase = "DELETE";
  const phraseToCopy = displayName.length > 0 ? displayName : fallbackPhrase;

  const matches =
    displayName.length > 0
      ? confirmText.trim() === displayName
      : confirmText.trim() === fallbackPhrase;

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleCopyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(phraseToCopy);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the text and copy manually");
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !matches) return;
    setIsDeleting(true);
    const result = await deleteProject(project.id);
    setIsDeleting(false);
    if (!result.ok) {
      toast.error(result.error || "Could not delete project");
      return;
    }
    toast.success("Project deleted");
    handleClose();
    router.refresh();
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5 text-left">
              <DialogTitle className="text-xl">Delete this project?</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">
                This permanently removes the project, portal access, and related data you
                store here. Clients will lose access to this portal. This cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              {displayName.length > 0
                ? "Copy or select the project name, then paste or type it in the confirmation field."
                : "Copy or select the text below, then paste or type it in the confirmation field."}
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={phraseToCopy}
                aria-readonly
                className="font-mono text-sm bg-muted/50 border-input select-all flex-1 min-w-0"
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => void handleCopyPhrase()}
                disabled={isDeleting}
                aria-label="Copy to clipboard"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-project-confirm" className="text-sm font-medium text-foreground">
              Confirmation
            </Label>
            <Input
              id="delete-project-confirm"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={displayName || fallbackPhrase}
              disabled={isDeleting}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!matches || isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting…" : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
