"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Smile } from "lucide-react";

export function WelcomeScreen({ projectData, onNext, onSkip }) {
  const hasQuestions = projectData.hasQuestions && projectData.questions?.length > 0;

  const handleGetStarted = () => {
    if (hasQuestions) {
      onNext(); // Go to questions screen
    } else {
      onSkip(); // Skip directly to personalized welcome
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-[40px]")}>
      {/* Icon */}
      <div className="flex flex-col align-center justify-center items-center gap-[16px]">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center p-3">
          <img
            src="/images/Logo-icon.svg"
            alt="Mably"
            className="w-full h-full"
            draggable={false}
          />
        </div>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <p className="text-orange-500 font-semibold">Let&apos;s Get Started</p>
          <h1 className="text-2xl font-bold text-gray-900">
            A quick thing before we start <Smile className="inline align-middle ml-1 text-black" size={22} strokeWidth={1.5} />
          </h1>
          <p className="text-gray-600 text-sm w-5/6 mx-auto">
            {hasQuestions 
              ? "Let's answer some quick questions to get things moving smoothly. It won't take long."
              : "Welcome to your project portal. Click below to continue."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleGetStarted}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-11"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        {hasQuestions && (
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full text-gray-600 hover:text-gray-900 font-medium h-11 bg-white"
          >
            Do this later
          </Button>
        )}
      </div>
    </div>
  );
}

