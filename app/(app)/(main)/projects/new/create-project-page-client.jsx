"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, DollarSign, Smile, Rocket, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateProjectStep1 } from "@/components/create-project/step-1";
import { CreateProjectStep2 } from "@/components/create-project/step-2";
import { CreateProjectStep3 } from "@/components/create-project/step-3";
import { CreateProjectStep4 } from "@/components/create-project/step-4";
import { CreateProjectStep5 } from "@/components/create-project/step-5";
import { Button } from "@/components/ui/button";
import { DEFAULT_BRAND_COLOR_HEX } from "@/components/brand-color-field";

const steps = [
  {
    number: 1,
    title: "Project & Client",
    description: "Create a project and link it with the right client to get started.",
    icon: FileText,
  },
  {
    number: 2,
    title: "Project Type & Pricing",
    description: "Define your project structure and set up pricing or milestones.",
    icon: DollarSign,
  },
  {
    number: 3,
    title: "Project Branding",
    description: "Customize how this project appears for the client in client portal.",
    icon: Smile,
  },
  {
    number: 4,
    title: "Client Kickoff",
    description: "Set the welcome message your client sees when they open the portal.",
    icon: Rocket,
  },
  {
    number: 5,
    title: "Invite & Launch",
    description: "Invite your client and begin collaboration.",
    icon: Send,
  },
];

export function CreateProjectPageClient({
  initialClients,
  initialClientId = "",
  defaultBrandColor = DEFAULT_BRAND_COLOR_HEX,
  createProjectBlockReason = null,
  polarConfigured = false,
  foundingPricing = null,
  currentPlanKey = null,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState(initialClients ?? []);
  const [step5DialogOpen, setStep5DialogOpen] = useState(false);
  /** Once set, step 5 updates this project instead of inserting another row (same wizard session). */
  const [wizardProjectId, setWizardProjectId] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1
    projectName: "",
    startDate: "",
    dueDate: "",
    projectScope: "",
    clientId: initialClientId,
    // Step 2
    projectType: "one-time",
    totalFee: "",
    milestones: [],
    // Step 3
    projectLogo: "",
    brandColor: defaultBrandColor,
    // Step 4
    welcomeMessage: "",
    questions: [],
    // Step 5
    clientEmail: "",
    inviteMessage: "",
  });

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleClientCreated = (client) => {
    if (!client?.id) return;
    const nextClient = {
      id: String(client.id),
      name: client.name || client.fullName || client.email || "Client",
      email: client.email || "",
      avatar: client.avatar || null,
    };
    setClients((prev) => {
      const exists = prev.some((item) => String(item.id) === nextClient.id);
      return exists
        ? prev.map((item) => (String(item.id) === nextClient.id ? { ...item, ...nextClient } : item))
        : [...prev, nextClient];
    });
    setFormData((prev) => ({
      ...prev,
      clientId: nextClient.id,
      clientEmail: nextClient.email,
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      // Open dialog after step 4
      setStep5DialogOpen(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateProjectStep1
            key="step-1"
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            clients={clients}
            onClientCreated={handleClientCreated}
          />
        );
      case 2:
        return (
          <CreateProjectStep2
            key="step-2"
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <CreateProjectStep3
            key="step-3"
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <CreateProjectStep4
            key="step-4"
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      default:
        return null;
    }
  };

  const activeStep = steps.find((s) => s.number === currentStep) ?? steps[0];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:h-screen lg:flex-row lg:gap-6 lg:p-6">
      {/* Left Side - Timeline & Steps (desktop) */}
      <div
        className="relative hidden w-full flex-col justify-between overflow-hidden rounded-3xl bg-cover bg-center lg:flex lg:h-full lg:w-1/2 lg:px-20 lg:pb-20 lg:pt-12"
        style={{
          backgroundImage: "url('/images/form-background.webp')",
        }}
      >
      
        {/* Content */}
        <div className="relative z-10">
        <Link href="/projects">
          <Button
            variant="text"
            size="lg"
            className="mb-4 inline-flex h-auto cursor-pointer items-center gap-2 px-0 hover:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              /> 
            </svg>
            Back to Projects
          </Button>
        </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Create New Project.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 lg:mb-12">
            Get started by setting up your project and client details.
          </p>

          {/* Timeline Steps */}
          <div className="space-y-4 lg:space-y-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex gap-3 sm:gap-4">
                  <div className="relative flex w-9 shrink-0 flex-col items-center self-stretch sm:w-11">
                    {index < steps.length - 1 && (
                      <div
                        aria-hidden
                        className={`absolute left-1/2 top-9 z-0 w-px -translate-x-1/2 border-l-2 border-dashed sm:top-11 -bottom-4 lg:-bottom-10 ${
                          isCompleted ? "border-primary" : "border-zinc-400"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 sm:h-11 sm:w-11 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                      }`}
                    >
                      <Icon className="h-[15px] w-[15px] sm:h-[18px] sm:w-[18px]" />
                    </div>
                  </div>
                  <div className="min-h-9 flex-1 sm:min-h-[64px]">
                    <h3 className="mb-0.5 text-lg font-semibold sm:mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box at Bottom */}
        {/* <div
          className="relative z-10 rounded-lg p-[16px] size-fit mx-auto"
          style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
        >
          <div className="flex gap-3 size-fit">
              <Info className="h-[28px] w-[28px] text-muted-foreground mt-0.5" strokeWidth={1.5} />

            <div>
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">
                You can always update everything later.
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create a project and link it with the right client to get started.
              </p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Form column */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-3xl bg-background lg:w-1/2">
        <div className="shrink-0 border-b px-1 pb-4 pt-1 lg:hidden">
          <Link href="/projects">
            <Button
              variant="text"
              size="sm"
              className="mb-3 inline-flex h-auto gap-2 px-0 hover:opacity-70"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Projects
            </Button>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Step {currentStep} of 5
          </p>
          <h1 className="mt-1 text-xl font-bold">{activeStep.title}</h1>
          <div
            className="mt-3 flex gap-1.5"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-label={`Step ${currentStep} of 5`}
          >
            {steps.map((step) => (
              <div
                key={step.number}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step.number <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-xl px-1 py-4 pb-8 sm:px-4 sm:py-6 lg:px-8 lg:pb-20 lg:pt-12">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Step 5 - Invite Dialog */}
      <CreateProjectStep5
        open={step5DialogOpen}
        onOpenChange={setStep5DialogOpen}
        formData={formData}
        updateFormData={updateFormData}
        clients={clients}
        wizardProjectId={wizardProjectId}
        onWizardProjectCreated={setWizardProjectId}
        createProjectBlockReason={createProjectBlockReason}
        polarConfigured={polarConfigured}
        foundingPricing={foundingPricing}
        currentPlanKey={currentPlanKey}
      />
    </div>
  );
}

