"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PolarPlanPickerDialog } from "@/components/billing/polar-plan-picker-dialog";
import { Copy, Send } from "lucide-react";
import { toast } from "sonner";
import {
  hasSeenFounderWelcome,
  queueFounderWelcomeAfterFirstProject,
} from "@/lib/founder/founder-welcome";
import { createProject, updateProjectInviteAndResend } from "@/lib/actions/projects";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   formData: object;
 *   updateFormData: (data: object) => void;
 *   clients?: object[];
 *   wizardProjectId?: string | null;
 *   onWizardProjectCreated?: (id: string) => void;
 *   createProjectBlockReason?: "no_subscription" | "starter_limit" | null;
 *   polarConfigured?: boolean;
 *   foundingPricing?: object | null;
 *   currentPlanKey?: string | null;
 * }} props
 */
export function CreateProjectStep5({
  open,
  onOpenChange,
  formData,
  updateFormData,
  clients = [],
  wizardProjectId = null,
  onWizardProjectCreated,
  createProjectBlockReason = null,
  polarConfigured = false,
  foundingPricing = null,
  currentPlanKey = null,
}) {
  const router = useRouter();
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [paywallKind, setPaywallKind] = useState(null);
  const [clientEmail, setClientEmail] = useState(formData.clientEmail || "");
  const [inviteMessage, setInviteMessage] = useState(
    formData.inviteMessage ||
      "I've set up your project portal. Please review the details and complete the next steps to get started."
  );
  const [isLoading, setIsLoading] = useState(false);
  /** Two-button rule: create | update (submit) vs afterSave (Go to projects only). */
  const [rightSlot, setRightSlot] = useState("create");
  const closedDialogWithProjectRef = useRef(false);

  const createdProjectId = wizardProjectId;

  const openPlanPicker = (kind) => {
    setPaywallKind(kind);
    onOpenChange(false);
    setPlanPickerOpen(true);
  };

  useEffect(() => {
    if (!open) {
      if (wizardProjectId) {
        closedDialogWithProjectRef.current = true;
      }
      return;
    }
    if (wizardProjectId && closedDialogWithProjectRef.current) {
      setRightSlot("update");
      closedDialogWithProjectRef.current = false;
    }
    if (!wizardProjectId) {
      setRightSlot("create");
    }
  }, [open, wizardProjectId]);

  useEffect(() => {
    if (!open) return;
    const selected = clients.find((c) => c.id === formData.clientId);
    setClientEmail(formData.clientEmail || selected?.email || "");
    setInviteMessage(
      formData.inviteMessage ||
        "I've set up your project portal. Please review the details and complete the next steps to get started."
    );
  }, [open, formData.clientId, formData.clientEmail, formData.inviteMessage, clients]);

  const projectLink =
    typeof window !== "undefined" && createdProjectId
      ? `${window.location.origin}/project/${createdProjectId}/dashboard`
      : "";

  const handleCopyLink = () => {
    if (!projectLink) {
      toast.error("Create the project first to get a shareable link.");
      return;
    }
    void navigator.clipboard.writeText(projectLink);
    toast.success("Project link copied", {
      description: "You can share this link with your client.",
    });
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!createdProjectId && createProjectBlockReason) {
      openPlanPicker(createProjectBlockReason);
      return;
    }

    setIsLoading(true);

    updateFormData({
      clientEmail,
      inviteMessage,
    });

    const result = createdProjectId
      ? await updateProjectInviteAndResend({
          projectId: createdProjectId,
          clientEmail,
          inviteMessage,
        })
      : await createProject({
          ...formData,
          clientEmail,
          inviteMessage,
        });

    setIsLoading(false);

    if (!result.ok) {
      if (result.code === "NO_ACTIVE_SUBSCRIPTION") {
        openPlanPicker("no_subscription");
        return;
      }
      if (result.code === "STARTER_ACTIVE_PROJECT_LIMIT") {
        openPlanPicker("starter_limit");
        return;
      }
      toast.error(result.error || "Could not save project");
      return;
    }

    const wasFirstCreate = !createdProjectId;

    if (wasFirstCreate && result.id && onWizardProjectCreated) {
      onWizardProjectCreated(result.id);
    }

    if (wasFirstCreate) {
      if (
        result.isFirstProject &&
        result.inviteSent &&
        !hasSeenFounderWelcome()
      ) {
        queueFounderWelcomeAfterFirstProject();
      }
      toast.success("Project created", {
        description: result.inviteSent
          ? "Your client invite is on its way."
          : "You can copy the portal link or open your project list.",
      });
      onOpenChange(false);
      router.push("/projects");
      router.refresh();
      return;
    }

    setRightSlot("afterSave");

    toast.success(
      createdProjectId ? "Invite updated" : "Project created",
      {
        description: createdProjectId
          ? "We sent another invite email with your latest details."
          : "You can copy the portal link or open your project list.",
      }
    );
  };

  const handleGoToProjects = () => {
    onOpenChange(false);
    router.push("/projects");
    router.refresh();
  };

  const blockedKind = paywallKind ?? createProjectBlockReason;
  const isStarterLimit = blockedKind === "starter_limit";
  const planPickerTitle = isStarterLimit ? "Upgrade to Growth" : "Choose your plan";
  const planPickerDescription = isStarterLimit
    ? "Your Starter plan includes one active project. Growth unlocks unlimited active projects and more storage."
    : "Subscribe to create projects and invite clients. Pick Starter or Growth — checkout opens in Polar.";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-primary font-semibold uppercase">Step 5 of 5</p>
              <DialogTitle className="text-2xl font-bold">Invite & Launch</DialogTitle>
              <p className="text-muted-foreground text-sm">
                Save your project and share the client portal link. If you close this dialog and
                open it again, we update the same project — no duplicates.
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-6 pt-2">
            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="clientEmail">Client email</FieldLabel>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="e.g. hello@sophiespace.com"
                  value={clientEmail}
                  required
                  disabled={isLoading}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="inviteMessage">Invite message</FieldLabel>
                <Textarea
                  id="inviteMessage"
                  placeholder="I've set up your project portal. Please review the details and complete the next steps to get started."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={isLoading}
                />
                <FieldDescription>Stored on the project for when you send email invites.</FieldDescription>
              </Field>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyLink}
                        className="gap-2"
                        disabled={!createdProjectId}
                      >
                        <Copy className="h-4 w-4" />
                        Copy project link
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!createdProjectId ? (
                    <TooltipContent side="top">
                      Create and send the invite first.
                    </TooltipContent>
                  ) : null}
                </Tooltip>
                {rightSlot === "afterSave" ? (
                  <Button
                    type="button"
                    onClick={handleGoToProjects}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    Go to projects
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading
                      ? "Saving…"
                      : rightSlot === "update"
                        ? "Update & resend invite"
                        : "Save & create project"}
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PolarPlanPickerDialog
        open={planPickerOpen}
        onOpenChange={setPlanPickerOpen}
        polarConfigured={polarConfigured}
        currentPlanKey={currentPlanKey}
        useUpgradeCtas={isStarterLimit}
        foundingPricing={foundingPricing}
        defaultPlan={isStarterLimit ? "growth" : null}
        title={planPickerTitle}
        description={planPickerDescription}
      />
    </>
  );
}
