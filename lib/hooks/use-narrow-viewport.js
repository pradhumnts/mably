"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `md` — mobile layouts where native PDF iframes misbehave. */
const NARROW_MEDIA_QUERY = "(max-width: 767px)";

/**
 * @returns {boolean}
 */
export function useNarrowViewport() {
  const [isNarrow, setIsNarrow] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(NARROW_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MEDIA_QUERY);
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isNarrow;
}
