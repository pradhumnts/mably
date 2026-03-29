"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { TextAnimate } from "@/components/ui/text-animate";

export function WelcomeMessageScreen({ clientName, onContinue }) {
  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  const welcomeMessage = `Hey ${clientName}, Welcome to your project portal. We'll use this space to share updates, files, and feedback throughout the project.`;

  return (
    <div className={cn("w-full max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6")}>
      <TextAnimate 
        animation="slideLeft" 
        by="character"
        duration={1}
        className={cn(
          "text-6xl md:text-7xl font-bold inline-block text-orange-500"
        )}
      >
        Welcome
      </TextAnimate>
      <TextAnimate 
        animation="blurInUp" 
        duration={2}
        delay={1}
        as="p"
        className="text-gray-800 text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
      >
        {welcomeMessage}
      </TextAnimate>
    </div>
  );
}


