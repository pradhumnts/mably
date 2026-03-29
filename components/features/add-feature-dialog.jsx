"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function AddFeatureDialog({ open, onOpenChange }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would send this to your backend
    console.log({ title, description, email, attachment });
    
    toast("Feature request submitted!", {
      description: "Thank you for your suggestion. We'll review it soon.",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setEmail("");
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a feature request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="My awesome feature request"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>

          {/* Description */}
          <Field>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                T Format
              </button>
            </div>
            <Textarea
              id="description"
              placeholder="Input description here"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </Field>

          {/* Email */}
          <Field>
            <FieldLabel htmlFor="email">
              Email <span className="text-muted-foreground font-normal">(Optional)</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Your email to receive notifications on this request"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {/* Attach File */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpeg,.jpg,.png,.svg"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-4 border border-dashed rounded-lg hover:bg-muted/50 transition-colors w-full"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium">
                  <span className="text-primary">Attach File.</span> Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  .jpeg, .jpg, .png, .svg up to 5MB
                </p>
              </div>
            </button>
            {attachment && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {attachment.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

