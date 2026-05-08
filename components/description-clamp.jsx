"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Clamps a block of text to 1 line and shows a working More/Less toggle inline
 * at the end of that line. The toggle only appears when the text actually
 * overflows. Safe to use inside an outer <Link>: the button stops click
 * propagation so it never triggers navigation.
 *
 * @param {{
 *   text?: string | null;
 *   className?: string;        // applied to the wrapper (margin/typography lives here)
 *   textClassName?: string;    // optional extra classes for the text node
 *   buttonClassName?: string;  // optional extra classes for the toggle button
 * }} props
 */
export function DescriptionClamp({ text, className, textClassName, buttonClassName }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
    };

    measure();

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, [text, expanded]);

  const value = (text ?? "").toString();
  if (!value.trim()) return null;

  const buttonBaseClass =
    "shrink-0 whitespace-nowrap text-xs font-medium text-foreground hover:underline focus-visible:underline focus-visible:outline-none";

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  if (expanded) {
    return (
      <div className={className}>
        <p className={textClassName}>{value}</p>
        <button
          type="button"
          onClick={handleToggle}
          className={cn("mt-0.5", buttonBaseClass, buttonClassName)}
        >
          Less
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-baseline gap-1.5", className)}>
      <span
        ref={ref}
        className={cn("min-w-0 flex-1 truncate", textClassName)}
      >
        {value}
      </span>
      {overflowing && (
        <button
          type="button"
          onClick={handleToggle}
          className={cn(buttonBaseClass, buttonClassName)}
        >
          More
        </button>
      )}
    </div>
  );
}
