"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CreateProjectStep5({ open, onOpenChange, formData, updateFormData, className, ...props }) {
  const router = useRouter();
  const [clientEmail, setClientEmail] = useState(formData.clientEmail || "");
  const [inviteMessage, setInviteMessage] = useState(formData.inviteMessage || "I've set up your project portal. Please review the details and complete the next steps to get started.");
  const [isLoading, setIsLoading] = useState(false);

  const projectLink = "https://mably.app/project/abc123"; // This would be generated after project creation

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectLink);
    toast("Project link copied!", {
      description: "You can share this link with your client.",
    });
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Update form data
    updateFormData({
      clientEmail,
      inviteMessage,
    });

    // Simulate API call to send invite
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast("Invite sent successfully!", {
      description: `Invitation sent to ${clientEmail}`,
    });

    setIsLoading(false);
    
    // Close dialog and redirect to projects page
    onOpenChange(false);
    
    setTimeout(() => {
      router.push("/projects");
    }, 500);
  };

  const handleClose = () => {
    // When closing without sending, redirect to projects page
    onOpenChange(false);
    setTimeout(() => {
      router.push("/projects");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleClose();
      else onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-primary font-semibold uppercase">
              Step 4 of 4
            </p>
            <DialogTitle className="text-2xl font-bold">Invite & Launch</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Send or share invitation to client for the project.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSendInvite} className="space-y-6 pt-2">
          {/* Form Fields */}
          <div className="space-y-4">
            {/* Client Email */}
            <Field>
              <FieldLabel htmlFor="clientEmail">
                Email
              </FieldLabel>
              <Input
                id="clientEmail"
                type="email"
                placeholder="e.g. hello@sophiespace.com"
                value={clientEmail}
                required
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </Field>

            {/* Invite Message */}
            <Field>
              <FieldLabel htmlFor="inviteMessage">
                Invite message
              </FieldLabel>
              <Textarea
                id="inviteMessage"
                placeholder="I've set up your project portal. Please review the details and complete the next steps to get started."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <FieldDescription>
                This message is shown in the invitation email.
              </FieldDescription>
            </Field>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Project Link
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? "Sending..." : "Sent Invite"}
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

