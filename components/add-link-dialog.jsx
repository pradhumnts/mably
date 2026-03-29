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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function AddLinkDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    linkName: "",
    linkUrl: "",
    description: "",
    needsApproval: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In the future, this will save to the database
    console.log("Link data:", formData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      linkName: "",
      linkUrl: "",
      description: "",
      needsApproval: false,
    });
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

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Link Name */}
            <div className="grid gap-2">
              <Label htmlFor="linkName">Link Name</Label>
              <Input
                id="linkName"
                name="linkName"
                placeholder="e.g., Homepage Design v2"
                value={formData.linkName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Link URL */}
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
              />
            </div>

            {/* Description/Comment */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                Comment/Description <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add any notes or comments about this link..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            {/* Needs Approval Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsApproval"
                checked={formData.needsApproval}
                onCheckedChange={(checked) => 
                  setFormData((prev) => ({ ...prev, needsApproval: checked }))
                }
              />
              <Label
                htmlFor="needsApproval"
                className="text-sm font-normal cursor-pointer"
              >
                This link needs client approval
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

