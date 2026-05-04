"use client";

import { useState } from "react";
import { FileText, DollarSign, Smile, Rocket, Send, Info } from "lucide-react";
import { CreateProjectStep1 } from "@/components/create-project/step-1";
import { CreateProjectStep2 } from "@/components/create-project/step-2";
import { CreateProjectStep3 } from "@/components/create-project/step-3";
import { CreateProjectStep4 } from "@/components/create-project/step-4";
import { CreateProjectStep5 } from "@/components/create-project/step-5";
import { Button } from "@/components/ui/button";

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
  createProjectBlockReason = null,
}) {
  const [currentStep, setCurrentStep] = useState(1);
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
    brandColor: "",
    // Step 4
    welcomeMessage: "",
    questions: [],
    // Step 5
    clientEmail: "",
    inviteMessage: "",
  });

  const updateFormData = (data) => {
    setFormData({ ...formData, ...data });
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
            clients={initialClients}
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

  return (
    <div className="flex flex-col lg:flex-row h-[100vh] max-w-[1600px] mx-auto p-[24px] gap-[24px]">
      {/* Left Side - Timeline & Steps (Fixed, Non-scrolling) */}
      <div
        className="relative w-full lg:w-[50%] h-auto lg:h-full bg-cover bg-center p-[32px] sm:p-8 lg:p-[80px] gap-[60px] flex flex-col justify-between rounded-3xl overflow-hidden"
        style={{
          backgroundImage: "url('/images/form-background.webp')",
        }}
      >
      
        {/* Content */}
        <div className="relative z-10">
        <a
          href="/projects"
        >
          <Button
            variant="text"
            size="lg"
            className="inline-flex items-center gap-2 px-0 h-auto mb-[8px] hover:opacity-50 cursor-pointer"
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
        </a>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Create New Project.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 lg:mb-12">
            Get started by setting up your project and client details.
          </p>

          {/* Timeline Steps */}
          <div className="space-y-6 lg:space-y-[60px]">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isUpcoming = currentStep < step.number;

              return (
                <div key={step.number} className="flex gap-3 sm:gap-4 relative">
                  {/* Vertical Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        absolute left-5 sm:left-6 top-12 sm:top-14 w-[.5px] h-[calc(100%+12px)] sm:h-[calc(100%+16px)]
                        border-l border-dashed
                        ${isCompleted ? "border-primary" : "border-zinc-400"}
                        bg-transparent
                      `}
                      style={{
                        borderLeftWidth: "2px",
                      }}
                    />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 flex items-center justify-center rounded-full h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 transition-all duration-300 ${
                      isActive
                        ? "bg-primary shadow-lg text-primary-foreground scale-100"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-0.5 sm:pt-1">
                    <h3
                      className={`font-semibold text-lg sm:text-lg mb-0.5 sm:mb-1 transition-colors`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm transition-colors text-muted-foreground`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box at Bottom */}
        <div
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
        </div>
      </div>

      {/* Right Side - Form Content (Scrollable) */}
      <div className="w-full lg:w-[50%] bg-background flex justify-center overflow-y-auto overflow-x-hidden rounded-3xl">
        <div className="w-full max-w-xl pt-[80px] sm:p-8 lg:py-[80px] pb-[40px]">
          {renderStep()}
        </div>
      </div>

      {/* Step 5 - Invite Dialog */}
      <CreateProjectStep5
        open={step5DialogOpen}
        onOpenChange={setStep5DialogOpen}
        formData={formData}
        updateFormData={updateFormData}
        clients={initialClients}
        wizardProjectId={wizardProjectId}
        onWizardProjectCreated={setWizardProjectId}
        createProjectBlockReason={createProjectBlockReason}
      />
    </div>
  );
}

