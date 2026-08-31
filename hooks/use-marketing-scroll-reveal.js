"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Subtle GSAP scroll reveals for marketing pages — split headings, fade-ins, staggered groups.
 * Elements inside `[data-animate-on-load]` animate on mount (above-the-fold).
 * @param {React.RefObject<HTMLElement | null>} rootRef
 */
export function useMarketingScrollReveal(rootRef) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    const root = rootRef.current;
    if (!root) return undefined;

    const mm = gsap.matchMedia(root);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const splits = [];

      const isOnLoad = (el) => Boolean(el.closest("[data-animate-on-load]"));

      root.querySelectorAll("[data-animate-on-load] [data-split]").forEach((el) => {
        const split = new SplitText(el, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.045,
            ease: "power4.out",
            delay: 0.12,
          }
        );
      });

      root.querySelectorAll("[data-animate-on-load] [data-reveal]").forEach((el, index) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power4.out",
            delay: 0.04 + index * 0.08,
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-split]")).forEach((el) => {
        if (isOnLoad(el)) return;
        const split = new SplitText(el, { type: "words" });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.04,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal]")).forEach((el) => {
        if (isOnLoad(el)) return;
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          }
        );
      });

      gsap.utils.toArray(root.querySelectorAll("[data-reveal-group]")).forEach((group) => {
        gsap.fromTo(
          group.querySelectorAll("[data-reveal-item]"),
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            stagger: 0.1,
            ease: "power4.out",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          }
        );
      });

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);

      return () => {
        window.removeEventListener("load", onLoad);
        splits.forEach((split) => split.revert());
      };
    });

    return () => mm.revert();
  }, [rootRef]);
}
