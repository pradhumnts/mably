"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  completeLibraryFileNewVersion,
  prepareLibraryFileUpload,
} from "@/lib/actions/project-library";
import { uploadProjectLibraryBlobWithProgress } from "@/lib/client/upload-project-library-blob";
import { getDemoBlockedResponse, isDemoProjectId } from "@/lib/data/demo-project";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   fileId: string;
 *   fileName: string;
 *   currentVersionNumber?: number;
 *   isFreelancer?: boolean;
 *   needsApproval?: boolean;
 *   maxFileBytes?: number;
 *   maxFileLabel?: string;
 *   onUploaded?: () => void;
 * }} props
 */
export function UploadLibraryVersionDialog({
  open,
  onOpenChange,
  projectId,
  fileId,
  fileName,
  currentVersionNumber = 1,
  isFreelancer = false,
  needsApproval = false,
  maxFileBytes,
  maxFileLabel,
  onUploaded,
}) {
  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [note, setNote] = useState("");
  const [requestApproval, setRequestApproval] = useState(needsApproval);
  const [submitting, setSubmitting] = useState(false);
  const [percent, setPercent] = useState(0);
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const reset = () => {
    setFile(null);
    setNote("");
    setRequestApproval(needsApproval);
    setPercent(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (next) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    if (isDemoProjectId(String(projectId))) {
      toast.error(getDemoBlockedResponse().error);
      return;
    }
    if (maxFileBytes && file.size > maxFileBytes) {
      toast.error(`File must be under ${maxFileLabel || "the size limit"}.`);
      return;
    }

    setSubmitting(true);
    setPercent(2);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setSubmitting(false);
      toast.error("Session expired. Refresh and sign in again.");
      return;
    }

    const prep = await prepareLibraryFileUpload({
      projectId: String(projectId),
      displayName: fileName,
      originalFilename: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
    if (!prep.ok || !prep.objectPath) {
      setSubmitting(false);
      toast.error(prep.error || "Could not prepare upload");
      return;
    }

    const up = await uploadProjectLibraryBlobWithProgress({
      blob: file,
      objectPath: prep.objectPath,
      accessToken: session.access_token,
      onProgress: (p) => setPercent(p.percent),
    });
    if (!up.ok) {
      setSubmitting(false);
      toast.error(up.error || "Upload failed");
      return;
    }

    setPercent(96);
    const completed = await completeLibraryFileNewVersion({
      projectId: String(projectId),
      fileId: String(fileId),
      objectPath: prep.objectPath,
      originalFilename: prep.normalizedOriginalFilename || file.name,
      mimeType: prep.mimeType || file.type || null,
      sizeBytes: prep.sizeBytes || file.size,
      needsApproval: isFreelancer && requestApproval,
      versionNote: note.trim() || null,
    });

    setSubmitting(false);
    if (!completed.ok) {
      await supabase.storage.from("project-library").remove([prep.objectPath]);
      toast.error(completed.error || "Could not save new revision");
      return;
    }

    toast.success("New revision uploaded");
    reset();
    onOpenChange(false);
    onUploaded?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload new revision</DialogTitle>
          <DialogDescription>
            Adds a new revision of{" "}
            <span className="font-medium text-foreground">{fileName}</span>. Earlier revisions stay
            in history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="library-version-file">File</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={submitting}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {file ? "Change file" : "Choose file"}
              </Button>
              {file ? (
                <span className="min-w-0 truncate text-sm text-muted-foreground">{file.name}</span>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              disabled={submitting}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="library-version-note">Note (optional)</Label>
            <Textarea
              id="library-version-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What changed in this revision?"
              disabled={submitting}
              className="resize-none text-sm"
            />
          </div>

          {isFreelancer ? (
            <div className="flex items-center gap-2">
              <Checkbox
                id="library-version-approval"
                checked={requestApproval}
                disabled={submitting}
                onCheckedChange={(checked) => setRequestApproval(checked === true)}
              />
              <Label htmlFor="library-version-approval" className="text-sm font-normal">
                Request client approval for this revision
              </Label>
            </div>
          ) : null}

          {submitting ? (
            <p className="text-xs text-muted-foreground">Uploading… {percent}%</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!file || submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Uploading…" : "Upload revision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
