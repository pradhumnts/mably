"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Activity, Library, CreditCard } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Activity,
    label: "Activity",
    eyebrow: "Stay in the loop",
    headline: (
      <>
        Every update,{" "}
        <span className="italic text-primary">always visible.</span>
      </>
    ),
    description:
      "The Activity feed gives your clients a real-time view of everything happening in their project — milestones hit, files uploaded, messages sent.",
    bullets: [
      "Real-time project timeline",
      "Milestone & task updates",
      "Feedback history in one place",
    ],
    image: "/images/activity-screen.png",
  },
  {
    id: 2,
    icon: Library,
    label: "Library",
    eyebrow: "Organised by default",
    headline: (
      <>
        Files and links,{" "}
        <span className="italic text-primary">always organised.</span>
      </>
    ),
    description:
      "Upload deliverables, share design links, and keep all project resources neatly organised in the Library. Your clients access everything without digging through emails.",
    bullets: [
      "Upload files of any type",
      "Share Figma, Notion & more links",
      "Everything organised by project",
    ],
    image: "/images/library-screen.png",
  },
  {
    id: 3,
    icon: CreditCard,
    label: "Payments",
    eyebrow: "No confusion, just pay",
    headline: (
      <>
        Your invoice tool, their{" "}
        <span className="italic text-primary">easiest pay day.</span>
      </>
    ),
    description:
      "Keep using Stripe, Wise, Contra — whatever you already love. Just drop your invoice link into Mably and your client sees a clear, simple payment button. No more confused emails about where to pay.",
    bullets: [
      "Works with any invoicing platform",
      "Clients pay in one click from the portal",
      "No switching tools, no extra setup",
    ],
    image: "/images/payments-screen.png",
  },
];

export default function WaitlistPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  const step = steps[currentStep - 1];
  const Icon = step.icon;

  const goTo = (next) => {
    setCurrentStep(next);
    setAnimKey((k) => k + 1);
  };

  const handleNext = () => {
    if (currentStep < steps.length) goTo(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goTo(currentStep - 1);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      {/* ── Left Panel ── */}
      <div className="flex flex-col w-full lg:w-[48%] h-full px-8 py-10 sm:px-12 sm:py-14 lg:px-20 lg:py-20 justify-between overflow-y-auto">
        {/* Logo */}
        <div className="mb-10">
          <img
            src="/images/Logo-SVG.svg"
            alt="Mably"
            className="h-8 w-auto"
            draggable={false}
          />
        </div>

        {/* Step content — animated on change */}
        <div
          key={animKey}
          className="flex-1 flex flex-col justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Step indicator bars */}
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                aria-label={`Go to step ${s.id}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-400 focus:outline-none",
                  s.id === currentStep
                    ? "w-10 bg-primary"
                    : s.id < currentStep
                    ? "w-6 bg-primary/40"
                    : "w-6 bg-muted-foreground/25"
                )}
              />
            ))}
          </div>

          {/* Eyebrow */}
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
            {step.eyebrow}
          </p>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight tracking-tight text-foreground">
            {step.headline}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
            {step.description}
          </p>

          {/* Bullet list */}
          <ul className="space-y-3">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm sm:text-base text-foreground">
                <span className="mt-1 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3 w-3 text-primary" />
                </span>
                {bullet}
              </li>
            ))}
          </ul>

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < steps.length ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="gap-2 px-6"
                onClick={() => (window.location.href = "/project/1")}
              >
                See it in action
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="mt-10 text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Mably. Built for freelancers & agencies.
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(140deg, #fff7f4 0%, #ffece4 40%, #ffd9c8 100%)",
        }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

        {/* Screenshot card — fills panel height, right edge cropped */}
        <div
          key={`img-${animKey}`}
          className="absolute inset-y-18 left-10 animate-in fade-in slide-in-from-bottom-6 duration-700"
        >
          <div className="h-full rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-white/60 bg-white">
            <img
              src={step.image}
              alt={step.label}
              className="h-full w-auto max-w-none object-left-top"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
