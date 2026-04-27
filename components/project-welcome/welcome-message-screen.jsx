"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TextAnimate } from "@/components/ui/text-animate";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function WelcomeMessageScreen({ clientName, welcomeMessage: customMessage, onContinue }) {
  const [showButton, setShowButton] = useState(false);

  // "Welcome" slides in over 1s, then message fades in with 1s delay + 2s duration = 3s total
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const welcomeMessage =
    typeof customMessage === "string" && customMessage.trim()
      ? customMessage.trim()
      : `Hey ${clientName}, welcome to your project portal. We'll use this space to share updates, files, and feedback throughout the project.`;

  return (
    <div className={cn("w-full max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8")}>
      <TextAnimate
        animation="slideLeft"
        by="character"
        duration={1}
        className={cn("text-6xl md:text-7xl font-bold inline-block text-orange-500")}
      >
        Welcome
      </TextAnimate>
      <TextAnimate
        animation="blurInUp"
        duration={2}
        delay={1.5}
        as="p"
        className="text-gray-800 text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
      >
        {welcomeMessage}
      </TextAnimate>

      <div
        className={cn(
          "pt-2 transition-all duration-700",
          showButton
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <Button
          onClick={onContinue}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4"
        >
          Enter your portal
          <ArrowRight className=" h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
