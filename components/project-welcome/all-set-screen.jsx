"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

export function AllSetScreen({ clientName, onContinue }) {
  // Auto-redirect after 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className={cn("w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500")}>
      <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-orange-500">
        All Set
      </h1>
    </div>
  );
}

