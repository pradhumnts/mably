"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { submitTeamContactMessage } from "@/lib/actions/team-contact";
import { MABLY_TEAM_AVATARS } from "@/lib/email/team-contact-email";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   user: { name?: string; email?: string };
 *   projectId?: string;
 * }}
 */
export function ChatWithTeamDialog({ open, onOpenChange, projectId }) {
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setIsSending(false);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    setIsSending(true);
    try {
      const result = await submitTeamContactMessage({
        message,
        pagePath: pathname,
        projectId: projectId || undefined,
      });

      if (!result.ok) {
        toast.error(result.error || "Could not send your message.");
        return;
      }

      toast.success("Message sent", {
        description: "Thanks — we'll be in touch soon.",
      });
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-[28rem]",
          "border-border/80 shadow-xl"
        )}
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-border/60 bg-muted/30 px-6 pb-5 pt-8 text-center">
            <AvatarGroup className="mx-auto justify-center">
              {MABLY_TEAM_AVATARS.map((member) => {
                const initial = (member.name || "?").trim().charAt(0).toUpperCase();
                return (
                  <Tooltip key={member.name}>
                    <TooltipTrigger asChild>
                      <Avatar className="size-8 border-1 border-background shadow-sm">
                        <AvatarImage
                          src={member.imageSrc}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xs font-medium">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      {member.name}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AvatarGroup>
            <DialogHeader className="mt-4 space-y-1.5 text-center">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Chat with team
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Feedback, bugs, questions — send us anything and we&apos;ll help.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Field>
              <FieldLabel htmlFor="team-contact-message" className="sr-only">
                Message
              </FieldLabel>
              <Textarea
                id="team-contact-message"
                placeholder="What can we help with?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="min-h-[120px] resize-none bg-background"
                required
                maxLength={5000}
                autoFocus
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSending} className="flex-1 gap-2 sm:flex-none">
              {isSending ? (
                "Sending…"
              ) : (
                <>
                  Send
                  <Send className="size-4" aria-hidden />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
