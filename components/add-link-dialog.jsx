"use client";

import { useState } from "react";
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
import { addLibraryLink } from "@/lib/actions/project-library";
import { toast } from "sonner";

/**
 * @param {{ open: boolean; onOpenChange: (open: boolean) => void; projectId: string; onSaved?: () => void }}
 */
export function AddLinkDialog({ open, onOpenChange, projectId, onSaved }) {
  const [formData, setFormData] = useState({
    linkName: "",
    linkUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await addLibraryLink(projectId, {
      title: formData.linkName.trim(),
      url: formData.linkUrl.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Could not add link");
      return;
    }
    toast.success("Link added");
    onOpenChange(false);
    setFormData({
      linkName: "",
      linkUrl: "",
    });
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Link</DialogTitle>
          <DialogDescription>
            Add a link to share with your team. You can add links from Figma, Loom, Google Drive, or any other platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="linkName">Link Name</Label>
              <Input
                id="linkName"
                name="linkName"
                placeholder="e.g., Homepage Design v2"
                value={formData.linkName}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                name="linkUrl"
                type="url"
                placeholder="https://figma.com/..."
                value={formData.linkUrl}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
