import { gsap } from "gsap";

const defaults = {
  duration: 1.35,
  ease: "power3.out",
  elementStagger: 0.12,
  digitStagger: 0.055,
  revealDuration: 0.65,
  revealEase: "power2.out",
  digitCycles: 2,
};

/**
 * Odometer-style number rolls (GSAP). Returns play + update for programmatic use.
 * ScrollTrigger not required — use `play` on mount and `update` on value changes.
 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function createNumberOdometer() {
  /** @type {WeakMap<Element, import("gsap").core.Timeline>} */
  const activeTweens = new WeakMap();

  /**
   * @param {Element} el
   * @param {string} targetText
   * @param {{ startValue?: number; duration?: number; ease?: string; delay?: number }} [options]
   */
  function play(el, targetText, options = {}) {
    if (!(el instanceof Element)) return;
    if (prefersReducedMotion()) {
      el.textContent = targetText;
      return;
    }

    const startValue = options.startValue ?? 0;
    const duration = options.duration ?? defaults.duration;
    const ease = options.ease ?? defaults.ease;
    const delay = options.delay ?? 0;
    const step = getLineHeightRatio(el);

    let segments = parseSegments(targetText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);

    const grow = shouldGrow(true, startValue, segments);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const revealTargets = revealEls.map((revealEl) => {
      const widthEm = revealEl.offsetWidth / fontSize;
      gsap.set(revealEl, { width: 0, overflow: "hidden" });
      return { el: revealEl, widthEm };
    });

    const tl = gsap.timeline({
      delay,
      onComplete() {
        finalizeElement(el, targetText);
      },
    });

    revealTargets.forEach(({ el: revealEl, widthEm }) => {
      tl.to(
        revealEl,
        {
          width: `${widthEm}em`,
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    });

    rollers.forEach(({ roller, targetPos, startDigit, endDigit }, digitIdx) => {
      if (endDigit === startDigit) return;
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(
        roller,
        {
          y: `${-targetPos * step}em`,
          duration,
          ease,
          force3D: true,
        },
        reversedIdx * defaults.digitStagger
      );
    });
  }

  /**
   * @param {Element} el
   * @param {string} newText
   * @param {{ duration?: number; ease?: string; fromText?: string }} [options]
   */
  function update(el, newText, options = {}) {
    if (!(el instanceof Element)) return;

    const currentText = (options.fromText ?? el.textContent ?? "")
      .trim()
      .replace(/\s+/g, "");
    const normalizedNew = newText.trim();
    if (currentText === normalizedNew) return;

    if (prefersReducedMotion()) {
      el.textContent = newText;
      return;
    }

    const duration = options.duration ?? defaults.duration;
    const ease = options.ease ?? defaults.ease;
    const step = getLineHeightRatio(el);

    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      finalizeElement(el, currentText);
    }

    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments = parseSegments(currentText);
    const startDigitsStr = startSegments
      .filter((s) => s.type === "digit")
      .map((s) => s.char)
      .join("");
    const startValue = parseInt(startDigitsStr, 10) || 0;
    const startDigitCount =
      startValue === 0 ? 1 : String(Math.floor(Math.abs(startValue))).length;

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const endDigitCount = segments.filter((s) => s.type === "digit").length;
    const grow = startDigitCount < endDigitCount;
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

    const newWidthEm = el.getBoundingClientRect().width / fontSize;
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) {
      gsap.set(el, { width: `${oldWidthEm}em`, overflow: "hidden" });
    }

    const revealTargets = revealEls.map((revealEl) => {
      const widthEm = revealEl.offsetWidth / fontSize;
      gsap.set(revealEl, { width: 0, overflow: "hidden", opacity: 0 });
      return { el: revealEl, widthEm };
    });

    const tl = gsap.timeline({
      onComplete() {
        finalizeElement(el, newText);
        activeTweens.delete(el);
      },
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(
        el,
        {
          width: `${newWidthEm}em`,
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    }

    revealTargets.forEach(({ el: revealEl, widthEm }) => {
      tl.to(
        revealEl,
        {
          width: `${widthEm}em`,
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        },
        0
      );
    });

    rollers.forEach(({ roller, targetPos, startDigit, endDigit }, digitIdx) => {
      if (endDigit === startDigit) return;
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(
        roller,
        {
          y: `${-targetPos * step}em`,
          duration,
          ease,
          force3D: true,
        },
        reversedIdx * defaults.digitStagger
      );
    });
  }

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === "normal") return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  /** @param {string} text */
  function parseSegments(text) {
    return [...text].map((char) => ({
      type: /\d/.test(char) ? "digit" : "static",
      char,
    }));
  }

  /** @param {ReturnType<typeof parseSegments>} segments */
  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter((s) => s.type === "digit");
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, "0")
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map((s) =>
      s.type === "digit" ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
    );
  }

  /** @param {ReturnType<typeof parseSegments>} segments */
  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter((s) => s.type === "digit").length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
    return segments.map((seg) => {
      if (seg.type === "digit") {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      // Only digit columns use reveal — static text (% OFF, spaces, $) stays visible.
      return { ...seg, hidden: false };
    });
  }

  function shouldGrow(hasExplicitStart, startValue, segments) {
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter((s) => s.type === "digit").length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = "";
    el.style.height = "";
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;

    segments.forEach((seg) => {
      if (seg.type === "static") {
        const span = document.createElement("span");
        span.setAttribute("data-odometer-part", "static");
        span.style.height = `${step}em`;
        span.style.lineHeight = String(step);
        // Regular spaces collapse in inline-block spans; keep width during roll.
        span.textContent = seg.char === " " ? "\u00a0" : seg.char;
        el.appendChild(span);
        return;
      }

      const mask = document.createElement("span");
      mask.setAttribute("data-odometer-part", "mask");
      mask.style.height = `${step}em`;
      mask.style.lineHeight = String(step);
      mask.style.overflow = "hidden";

      const roller = document.createElement("span");
      roller.setAttribute("data-odometer-part", "roller");
      roller.style.lineHeight = String(step);

      const digits = [];
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10);
      }
      roller.textContent = digits.join("\n");
      mask.appendChild(roller);
      el.appendChild(mask);

      const startDigit = seg.startDigit || 0;
      const isReveal = grow && seg.hidden;
      gsap.set(roller, { y: isReveal ? `${step}em` : `${-startDigit * step}em` });

      const endDigit = parseInt(seg.char, 10);
      const targetPos = rollerTargetPosition(startDigit, endDigit);
      rollers.push({ roller, targetPos, startDigit, endDigit });
      if (isReveal) revealEls.push(mask);
    });

    return { rollers, revealEls };
  }

  /** @param {number} startDigit @param {number} endDigit */
  function rollerTargetPosition(startDigit, endDigit) {
    if (endDigit > startDigit) return endDigit;
    if (endDigit < startDigit) return 10 + endDigit;
    return endDigit;
  }

  /** Reset to plain text so digit-count changes never leave orphan masks/rollers. */
  function finalizeElement(el, originalText) {
    gsap.killTweensOf(el);
    el.querySelectorAll("[data-odometer-part]").forEach((node) => {
      gsap.killTweensOf(node);
    });
    el.style.overflow = "";
    el.style.height = "";
    el.style.width = "";
    el.textContent = originalText;
  }

  return { play, update };
}
