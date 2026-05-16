"use client";

import { useLayoutEffect, useRef } from "react";
import { createNumberOdometer } from "@/lib/animations/number-odometer";
import { cn } from "@/lib/utils";

/**
 * Rolling digit odometer (GSAP). Animates on first `active`, then `update` on value change.
 * Does not render `value` as children — React would overwrite roller DOM on prop changes.
 *
 * @param {{
 *   value: string;
 *   startValue?: number;
 *   duration?: number;
 *   delay?: number;
 *   active?: boolean;
 *   className?: string;
 *   as?: "span" | "p";
 * }} props
 */
export function NumberOdometer({
  value,
  startValue = 0,
  duration = 1,
  delay = 0,
  active = true,
  className,
  as: Tag = "span",
}) {
  const elRef = useRef(null);
  const controllerRef = useRef(null);
  const hasPlayedRef = useRef(false);
  const prevValueRef = useRef(null);

  useLayoutEffect(() => {
    if (!active) {
      hasPlayedRef.current = false;
      prevValueRef.current = null;
      const el = elRef.current;
      if (el) el.textContent = "";
      return;
    }

    const el = elRef.current;
    if (!el) return;

    if (!controllerRef.current) {
      controllerRef.current = createNumberOdometer();
    }
    const { play, update } = controllerRef.current;

    if (!hasPlayedRef.current) {
      play(el, value, { startValue, duration, delay });
      hasPlayedRef.current = true;
      prevValueRef.current = value;
      return;
    }

    const fromText = prevValueRef.current;
    if (fromText !== value) {
      update(el, value, {
        duration: duration * 0.85,
        fromText: fromText ?? undefined,
      });
      prevValueRef.current = value;
    }
  }, [value, startValue, duration, delay, active]);

  return (
    <Tag
      ref={elRef}
      className={cn(
        "inline-flex items-center font-variant-numeric tabular-nums text-inherit",
        className
      )}
      data-odometer-element
      aria-label={value}
      suppressHydrationWarning
    />
  );
}
