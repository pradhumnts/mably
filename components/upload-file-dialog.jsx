"use client";

import { useState } from "react";
import {
  STARTER_LIBRARY_MAX_FILE_BYTES,
  STARTER_LIBRARY_MAX_FILE_LABEL,
} from "@/lib/billing/library-storage-policy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { uploadLibraryFile } from "@/lib/actions/project-library";
import { toast } from "sonner";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   onUploaded?: () => void;
 *   isFreelancer?: boolean;
 *   maxFileBytes?: number;
 *   maxFileLabel?: string;
 * }}
 */
export function UploadFileDialog({
  open,
  onOpenChange,
  projectId,
  onUploaded,
  isFreelancer = true,
  maxFileBytes: maxFileBytesProp,
  maxFileLabel: maxFileLabelProp,
}) {
  const maxFileBytes = maxFileBytesProp ?? STARTER_LIBRARY_MAX_FILE_BYTES;
  const maxFileLabel = maxFileLabelProp ?? STARTER_LIBRARY_MAX_FILE_LABEL;
  const [formData, setFormData] = useState({
    fileName: "",
    file: null,
    comment: "",
    needsApproval: false,
  });
  const [selectedFileName, setSelectedFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, file: null }));
      setSelectedFileName("");
      return;
    }
    if (file.size > maxFileBytes) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFormData((prev) => ({ ...prev, file: null }));
      setSelectedFileName("");
      input.value = "";
      toast.error("File too large", {
        description: `This file is about ${mb} MB. The maximum upload size is ${maxFileLabel}. Choose a smaller file or compress it first.`,
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      file,
    }));
    setSelectedFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = formData.file;
    if (!file) {
      toast.error("No file selected", {
        description: "Choose a file from your device before uploading.",
      });
      return;
    }
    if (file.size > maxFileBytes) {
      toast.error("File too large", {
        description: `This file exceeds the ${maxFileLabel} limit. Pick a smaller file.`,
      });
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("file", file);
    fd.set("displayName", formData.fileName.trim());
    fd.set("description", formData.comment);
    fd.set("needsApproval", formData.needsApproval ? "1" : "0");

    const res = await uploadLibraryFile(fd);
    setSubmitting(false);

    if (!res.ok) {
      const msg = res.error || "Something went wrong. Please try again.";
      const sizeRelated = /too large|maximum upload|body exceeded|limit/i.test(msg);
      toast.error(sizeRelated ? "File too large" : "Upload failed", {
        description: msg,
      });
      return;
    }

    toast.success("File uploaded", {
      description: "It is now available in the project library.",
    });
    onOpenChange(false);
    setFormData({
      fileName: "",
      file: null,
      comment: "",
      needsApproval: false,
    });
    setSelectedFileName("");
    onUploaded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload File</DialogTitle>
          <DialogDescription>
            Upload a file for everyone on this project with portal access. Maximum file size:{" "}
            {maxFileLabel}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                name="fileName"
                placeholder="e.g., Brand Guidelines v2"
                value={formData.fileName}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <div className="relative">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  disabled={submitting}
                  className="cursor-pointer"
                />
                {selectedFileName && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="truncate">{selectedFileName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comment">
                Comment / description <span className="text-muted-foreground text-sm">(optional)</span>
              </Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Add any notes about this file…"
                value={formData.comment}
                onChange={handleInputChange}
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsApproval"
                checked={formData.needsApproval}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, needsApproval: Boolean(checked) }))
                }
                disabled={submitting}
              />
              <Label htmlFor="needsApproval" className="text-sm font-normal cursor-pointer">
                {isFreelancer
                  ? "This file needs client approval"
                  : "This file needs freelancer approval"}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Uploading…" : "Upload File"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
