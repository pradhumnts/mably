"use client";

import { useEffect, useRef, useState } from "react";
import { fireFounderWelcomeConfetti } from "@/lib/client/founder-welcome-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  FOUNDER_WELCOME_COPY,
  FOUNDER_WELCOME_TEAM,
  markFounderWelcomeSeen,
} from "@/lib/founder/founder-welcome";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 * }}
 */
export function FounderWelcomeDialog({ open, onOpenChange }) {
  const { founder } = FOUNDER_WELCOME_COPY;
  const founderInitial = (founder.name || "?").trim().charAt(0).toUpperCase() || "?";
  const [founderImageSrc, setFounderImageSrc] = useState(founder.imageSrc);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (open) setFounderImageSrc(founder.imageSrc);
  }, [open, founder.imageSrc]);

  useEffect(() => {
    if (!open || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    // After dialog portal mounts so confetti canvas stacks above the overlay.
    const id = window.requestAnimationFrame(() => {
      fireFounderWelcomeConfetti();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const handleOpenChange = (next) => {
    if (!next) markFounderWelcomeSeen();
    onOpenChange(next);
  };

  const handleDismiss = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border/80",
          "bg-white p-0 shadow-xl sm:max-w-[32rem]"
        )}
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-8 sm:pt-10">
          <Avatar className="h-20 w-20 border-2 border-white shadow-md ring-1 ring-border/60">
            <AvatarImage
              src={founderImageSrc}
              alt={founder.name}
              className="object-cover"
              onError={() => setFounderImageSrc(founder.imageSrc)}
            />
            <AvatarFallback className="text-xl font-semibold">{founderInitial}</AvatarFallback>
          </Avatar>

          <p className="mt-4 text-sm text-muted-foreground">{FOUNDER_WELCOME_COPY.eyebrow}</p>
          <DialogTitle className="mt-2 text-base font-semibold leading-snug text-foreground">
            Welcome from {founder.name.split(/\s+/)[0]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Personal welcome after your first project is created
          </DialogDescription>
          
          <p className="mt-2 text-xl font-medium leading-snug text-foreground">
            {FOUNDER_WELCOME_COPY.headline}
          </p>

          <div className="mt-4 space-y-3 text-left text-sm leading-relaxed text-muted-foreground border-t border-border/70 pt-6">
            {FOUNDER_WELCOME_COPY.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-4 w-full text-left text-sm leading-relaxed text-muted-foreground">
            {FOUNDER_WELCOME_COPY.projectCapabilitiesParagraph}
          </p>

          <div className="mt-6 w-full text-left text-sm text-foreground">
            <p className="text-muted-foreground">{FOUNDER_WELCOME_COPY.signOff}</p>
            <img
              src={founder.signatureSrc}
              alt={`${founder.name} signature`}
              className="mt-3 h-20 w-auto max-w-[200px] object-contain object-left"
              draggable={false}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {founder.name} · {founder.title}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {founder.emailLabel}{" "}
              <a
                href={`mailto:${founder.email}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {founder.email}
              </a>
            </p>
          </div>

          <Button
            type="button"
            className="mt-8 h-11 w-full rounded-lg text-base font-semibold"
            onClick={handleDismiss}
          >
            {FOUNDER_WELCOME_COPY.cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
