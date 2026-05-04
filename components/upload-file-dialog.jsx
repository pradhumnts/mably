"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import { toast } from "sonner";

/**
 * @param {FormData} formData
 * @param {number} fileSize
 * @param {{ onProgress?: (s: { phase: 'sending' | 'finishing'; percent: number; loaded: number; total: number }) => void; getXhr?: (xhr: XMLHttpRequest) => void }} opts
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
function postLibraryUploadWithProgress(formData, fileSize, { onProgress, getXhr } = {}) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    getXhr?.(xhr);
    xhr.open("POST", "/api/project-library/upload");
    xhr.withCredentials = true;
    xhr.responseType = "json";

    let maxRealPercent = 0;
    let uploadBodyDone = false;
    let requestDone = false;
    let rafId = 0;
    const t0 = performance.now();
    /** Conservative ETA so the bar moves even when `upload.progress` never fires (common in dev / some proxies). */
    const estDurationMs = Math.max(
      1200,
      Math.min(120_000, (Math.max(fileSize, 1) / (128 * 1024)) * 1000)
    );

    const emitSending = () => {
      if (!onProgress || uploadBodyDone || requestDone) return;
      const elapsed = performance.now() - t0;
      const t = Math.min(1, elapsed / estDurationMs);
      const simulated = Math.min(93, Math.round((1 - (1 - t) ** 2) * 93));
      const percent = Math.min(99, Math.max(simulated, maxRealPercent));
      const loaded = Math.round((percent / 100) * Math.max(fileSize, 1));
      onProgress({
        phase: "sending",
        percent,
        loaded,
        total: Math.max(fileSize, 1),
      });
    };

    const stopPulse = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const pulse = () => {
      emitSending();
      if (!uploadBodyDone && !requestDone) {
        rafId = requestAnimationFrame(pulse);
      }
    };

    xhr.upload.onprogress = (e) => {
      if (!onProgress || uploadBodyDone) return;
      const baseTotal = e.lengthComputable && e.total > 0 ? e.total : Math.max(fileSize, 1);
      const denom = Math.max(baseTotal, e.loaded, 1);
      const p = Math.min(99, Math.round((e.loaded / denom) * 100));
      maxRealPercent = Math.max(maxRealPercent, p);
      emitSending();
    };

    xhr.upload.onloadstart = () => {
      emitSending();
    };

    xhr.upload.onload = () => {
      uploadBodyDone = true;
      stopPulse();
      onProgress?.({ phase: "finishing", percent: 100, loaded: fileSize, total: fileSize });
    };

    const finish = (result) => {
      requestDone = true;
      uploadBodyDone = true;
      stopPulse();
      resolve(result);
    };

    xhr.addEventListener("load", () => {
      let body = xhr.response;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = { ok: false, error: "Invalid response from server" };
        }
      }
      if (body && typeof body === "object" && "ok" in body) {
        finish(body);
        return;
      }
      finish({ ok: false, error: `Upload failed (${xhr.status})` });
    });

    xhr.addEventListener("error", () => {
      finish({ ok: false, error: "Network error. Check your connection and try again." });
    });

    xhr.addEventListener("abort", () => {
      finish({ ok: false, error: "Upload cancelled." });
    });

    rafId = requestAnimationFrame(pulse);
    xhr.send(formData);
  });
}

function formatMb(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0";
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? mb.toFixed(0) : mb.toFixed(1);
}

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
  /** @type {React.MutableRefObject<XMLHttpRequest | null>} */
  const xhrRef = useRef(null);
  /** @type {[null | { phase: 'sending' | 'finishing'; percent: number; loaded: number; total: number }, React.Dispatch<any>]} */
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!open) {
      xhrRef.current?.abort();
      xhrRef.current = null;
      setSubmitting(false);
      setProgress(null);
    }
  }, [open]);

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

  const handleDialogOpenChange = (next) => {
    if (!next) {
      xhrRef.current?.abort();
    }
    onOpenChange(next);
  };

  const handleCancelClick = () => {
    if (submitting) {
      xhrRef.current?.abort();
      setSubmitting(false);
      setProgress(null);
      return;
    }
    onOpenChange(false);
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

    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("file", file);
    fd.set("displayName", formData.fileName.trim());
    fd.set("description", formData.comment);
    fd.set("needsApproval", formData.needsApproval ? "1" : "0");

    setSubmitting(true);
    setProgress({ phase: "sending", percent: 0, loaded: 0, total: file.size });

    const res = await postLibraryUploadWithProgress(fd, file.size, {
      onProgress: (next) => {
        flushSync(() => setProgress(next));
      },
      getXhr: (xhr) => {
        xhrRef.current = xhr;
      },
    });

    xhrRef.current = null;
    setSubmitting(false);
    setProgress(null);

    if (!res.ok) {
      const msg = res.error || "Something went wrong. Please try again.";
      if (msg === "Upload cancelled.") {
        return;
      }
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

  const phaseLabel =
    progress?.phase === "finishing" ? "Saving to library…" : "Uploading…";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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

            {submitting && progress ? (
              <div
                className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5"
                role="status"
                aria-live="polite"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/85">{phaseLabel}</span>
                  <span className="tabular-nums shrink-0 text-muted-foreground">
                    {progress.phase === "finishing" ? (
                      "Almost done"
                    ) : (
                      <>
                        <span className="text-foreground/90">{progress.percent}%</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span>
                          {formatMb(progress.loaded)} / {formatMb(progress.total)} MB
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div
                  className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/12"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.percent}
                  aria-label="Upload progress"
                >
                  <div
                    className="h-full rounded-full bg-primary/85 transition-[width] duration-150 ease-out motion-reduce:transition-none"
                    style={{ width: `${progress.phase === "finishing" ? 100 : progress.percent}%` }}
                  />
                </div>
              </div>
            ) : null}

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
            <Button type="button" variant="outline" onClick={handleCancelClick}>
              {submitting ? "Cancel upload" : "Cancel"}
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
