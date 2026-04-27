"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "mably-portal-onboarding";

/** Set paths under `public/` when you add screenshots (e.g. `"/images/portal/activity.png"`). */
const PORTAL_ONBOARD_IMAGES = {
  welcome: null,
  activity: null,
  library: null,
  chat: null,
};

function completionStorageKey(projectId, isFreelancer) {
  return `${STORAGE_PREFIX}:${projectId}:${isFreelancer ? "freelancer" : "client"}`;
}

/**
 * @typedef {{ title: string; description: string; imageSrc?: string | null; imageAlt?: string }} PortalOnboardStep
 */

/** @param {{ isFreelancer: boolean; projectName: string }} p */
function buildSteps({ isFreelancer, projectName }) {
  return [
    {
      title: "Welcome to the portal",
      description: isFreelancer
        ? `${projectName}: the same space your client sees—Activity, Library, and chat, aligned with you.`
        : `${projectName} lives here. Jump between sections from the left—everything stays in one place.`,
      imageSrc: PORTAL_ONBOARD_IMAGES.welcome,
      imageAlt: "Portal overview",
    },
    {
      title: "Activity",
      description:
        "Updates, comments, and milestones in order—scan what changed without digging through email.",
      imageSrc: PORTAL_ONBOARD_IMAGES.activity,
      imageAlt: "Activity",
    },
    {
      title: "Library",
      description: "Files and links together—uploads, approvals, and references next to the work.",
      imageSrc: PORTAL_ONBOARD_IMAGES.library,
      imageAlt: "Library",
    },
    {
      title: "Chat",
      description: isFreelancer
        ? "The floating bubble is for quick back-and-forth with your client—no need to leave the portal."
        : "Use the floating chat to ask your freelancer anything short—context stays with the project.",
      imageSrc: PORTAL_ONBOARD_IMAGES.chat,
      imageAlt: "Chat",
    },
  ];
}

function StepMedia({ imageSrc, imageAlt, className }) {
  if (imageSrc) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-lg border border-border/80 bg-muted/40",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- optional screenshots from /public or CDN */}
        <img
          src={imageSrc}
          alt={imageAlt || ""}
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 text-muted-foreground",
        className
      )}
      aria-hidden
    >
      <ImageIcon className="h-8 w-8 opacity-50" strokeWidth={1.25} />
      <span className="text-xs font-medium">Image coming soon</span>
    </div>
  );
}

/**
 * First-visit onboarding for the project portal (client + freelancer).
 * @param {{ projectId: string; isFreelancer: boolean; projectName?: string | null }} props
 */
export function PortalOnboardingDialog({ projectId, isFreelancer, projectName }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const name = (projectName && String(projectName).trim()) || "this project";
  const steps = useMemo(
    () => buildSteps({ isFreelancer, projectName: name }),
    [isFreelancer, name]
  );
  const total = steps.length;
  const isLast = stepIndex >= total - 1;
  const step = steps[stepIndex];

  const markDone = useCallback(() => {
    if (typeof window === "undefined" || !projectId) return;
    try {
      window.localStorage.setItem(completionStorageKey(projectId, isFreelancer), "1");
    } catch {
      /* ignore quota / private mode */
    }
  }, [projectId, isFreelancer]);

  const finish = useCallback(() => {
    markDone();
    setOpen(false);
    setStepIndex(0);
  }, [markDone]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !projectId) return;
    try {
      const done = window.localStorage.getItem(completionStorageKey(projectId, isFreelancer));
      if (done !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [mounted, projectId, isFreelancer]);

  const goNext = () => {
    if (isLast) finish();
    else setStepIndex((i) => Math.min(i + 1, total - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          markDone();
          setStepIndex(0);
        }
        setOpen(next);
      }}
    >
      <DialogContent
        showCloseButton
        className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-4 sm:p-7">
          <DialogHeader className="gap-1 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quick tour · {stepIndex + 1} / {total}
            </p>
            <DialogTitle className="text-lg font-semibold leading-snug sm:text-xl">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-pretty text-sm leading-relaxed pt-1">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5">
            <StepMedia imageSrc={step.imageSrc} imageAlt={step.imageAlt} />
          </div>

          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border/80 bg-muted/20 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={finish}
          >
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="button" size="sm" className="gap-1 min-w-[5.5rem]" onClick={goNext}>
              {isLast ? "Done" : "Next"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
