"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Triangle } from "lucide-react";
import { toast } from "sonner";
import { FieldLabel } from "../ui/field";

export function FeatureDetailDialog({ feature, open, onOpenChange, onVote, hasVoted }) {
  const [comment, setComment] = useState("");

  if (!feature) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleVote = () => {
    if (onVote) {
      onVote(feature.id);
    }
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    
    toast("Comment submitted!", {
      description: "Your comment has been added.",
    });
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl pr-8">{feature.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vote and Status */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-colors ${
                hasVoted 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-zinc-100"
              }`}
              onClick={handleVote}
            >
              <Triangle className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
              <span className="text-sm font-semibold">{feature.votes}</span>
            </Button>
            <Badge variant="outline" className={getStatusColor(feature.status)}>
              {feature.status}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t">
            {/* Comment Input with Toolbar */}
            <div className="space-y-2">
                <FieldLabel>Comment</FieldLabel>
              <div className="border rounded-lg">
                
                {/* Textarea */}
                <Textarea
                  placeholder="Input your comment here"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="resize-none border-0 focus-visible:ring-0 rounded-t-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end">
                {/* <Button variant="ghost" size="sm" className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  Add Attachment
                </Button> */}
                <Button onClick={handleSubmitComment} disabled={!comment.trim()}>
                  Submit
                </Button>
              </div>
            </div>

            {/* No comments message */}
            <div className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

