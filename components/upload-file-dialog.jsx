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
import { Upload } from "lucide-react";

export function UploadFileDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    fileName: "",
    file: null,
    comment: "",
    needsApproval: false,
  });
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file: file,
      }));
      setSelectedFileName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In the future, this will upload the file to storage
    console.log("File data:", {
      customFileName: formData.fileName,
      originalFileName: formData.file?.name,
      fileSize: formData.file?.size,
      fileType: formData.file?.type,
      comment: formData.comment,
      needsApproval: formData.needsApproval,
    });
    
    onOpenChange(false);
    
    // Reset form
    setFormData({
      fileName: "",
      file: null,
      comment: "",
      needsApproval: false,
    });
    setSelectedFileName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to share with your team. Supported formats include PDFs, images, documents, and more.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* File Name */}
            <div className="grid gap-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                name="fileName"
                placeholder="e.g., Brand Guidelines v2"
                value={formData.fileName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* File Upload */}
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <div className="relative">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  required
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

            {/* Comment/Description */}
            <div className="grid gap-2">
              <Label htmlFor="comment">
                Comment/Description <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Add any notes or comments about this file..."
                value={formData.comment}
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
                This file needs client approval
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
              Upload File
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

