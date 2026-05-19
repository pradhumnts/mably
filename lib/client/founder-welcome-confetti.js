import confetti from "canvas-confetti";

const CONFETTI_COLORS = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
const DURATION_MS = 3 * 1000;
/** Above dialog overlay (z-100) and content (z-101). */
const CONFETTI_Z_INDEX = 9999;

/** Side-cannon confetti burst (used once with the founder welcome modal). */
export function fireFounderWelcomeConfetti() {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = String(CONFETTI_Z_INDEX);
  document.body.appendChild(canvas);

  const shoot = confetti.create(canvas, { resize: true });
  const end = Date.now() + DURATION_MS;

  const frame = () => {
    if (Date.now() > end) return;

    shoot({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: CONFETTI_COLORS,
    });
    shoot({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: CONFETTI_COLORS,
    });

    requestAnimationFrame(frame);
  };

  frame();

  window.setTimeout(() => {
    canvas.remove();
  }, DURATION_MS + 400);
}
