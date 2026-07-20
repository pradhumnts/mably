"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CHIP_STYLES = [
  "bg-orange-600",
  "bg-emerald-700",
  "bg-violet-500",
  "bg-amber-500",
  "bg-red-500",
];

/**
 * Matter.js-powered chip pile (OSMO "falling elements" pattern, but with DOM
 * pills instead of canvas sprites so the text stays crisp and SEO-readable).
 *
 * Chips render as a static flex pile first (SSR / reduced-motion fallback).
 * When scrolled into view they switch to physics bodies: they drop with
 * gravity, bounce, stack on the floor, and can be dragged with mouse/touch.
 *
 * @param {{ chips: string[] }} props
 */
export function FallingChips({ chips }) {
  const containerRef = useRef(null);
  const chipRefs = useRef([]);
  const [physics, setPhysics] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chips?.length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let disposed = false;
    let cleanupPhysics = null;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { threshold: 0.35 }
    );
    io.observe(container);

    async function start() {
      const mod = await import("matter-js");
      const Matter = mod.default ?? mod;
      if (disposed) return;

      const { Engine, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;

      const els = chipRefs.current.filter(Boolean);
      // Measure pills while they're still in normal flow
      const sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));

      setPhysics(true);
      // Wait a frame so pills have switched to absolute positioning
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (disposed) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const engine = Engine.create();
      engine.world.gravity.y = 1.6;

      // Floor, side walls, and a ceiling far above the spawn zone
      const wallDepth = 200;
      const spawnCeiling = 640;
      Composite.add(engine.world, [
        Bodies.rectangle(width / 2, height + wallDepth / 2, width * 3, wallDepth, { isStatic: true }),
        Bodies.rectangle(-wallDepth / 2, height / 2 - spawnCeiling / 2, wallDepth, height + spawnCeiling * 2, { isStatic: true }),
        Bodies.rectangle(width + wallDepth / 2, height / 2 - spawnCeiling / 2, wallDepth, height + spawnCeiling * 2, { isStatic: true }),
        Bodies.rectangle(width / 2, -spawnCeiling - wallDepth / 2, width * 3, wallDepth, { isStatic: true }),
      ]);

      const bodies = els.map((el, index) => {
        const { w, h } = sizes[index];
        const x = w / 2 + 8 + Math.random() * Math.max(1, width - w - 16);
        return Bodies.rectangle(x, -h / 2 - Math.random() * 200, w, h, {
          chamfer: { radius: h / 2 },
          restitution: 0.55,
          friction: 0.4,
          frictionAir: 0.012,
          angle: (Math.random() - 0.5) * 0.5,
        });
      });

      const timers = bodies.map((body, index) =>
        window.setTimeout(() => {
          if (disposed) return;
          Composite.add(engine.world, body);
          els[index].style.opacity = "1";
        }, index * 130)
      );

      const sync = () => {
        bodies.forEach((body, index) => {
          const el = els[index];
          if (!el) return;
          const { w, h } = sizes[index];
          el.style.transform = `translate(${body.position.x - w / 2}px, ${
            body.position.y - h / 2
          }px) rotate(${body.angle}rad)`;
        });
      };
      sync();
      Events.on(engine, "afterUpdate", sync);

      // Drag interaction
      const mouse = Mouse.create(container);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.2, render: { visible: false } },
      });
      Composite.add(engine.world, mouseConstraint);

      // Fix: allow native page scroll over the physics area
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      mouse.element.removeEventListener("wheel", mouse.mousewheel);

      // Fix: scroll on touch devices — only capture touches while dragging a chip
      mouse.element.removeEventListener("touchstart", mouse.mousedown);
      mouse.element.removeEventListener("touchmove", mouse.mousemove);
      mouse.element.removeEventListener("touchend", mouse.mouseup);
      const onTouchStart = (e) => mouse.mousedown(e);
      const onTouchMove = (e) => {
        if (mouseConstraint.body) mouse.mousemove(e);
      };
      const onTouchEnd = (e) => {
        if (mouseConstraint.body) mouse.mouseup(e);
      };
      mouse.element.addEventListener("touchstart", onTouchStart, { passive: true });
      mouse.element.addEventListener("touchmove", onTouchMove);
      mouse.element.addEventListener("touchend", onTouchEnd);

      const runner = Runner.create();
      Runner.run(runner, engine);

      cleanupPhysics = () => {
        timers.forEach((t) => window.clearTimeout(t));
        Events.off(engine, "afterUpdate", sync);
        Runner.stop(runner);
        mouse.element.removeEventListener("touchstart", onTouchStart);
        mouse.element.removeEventListener("touchmove", onTouchMove);
        mouse.element.removeEventListener("touchend", onTouchEnd);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    }

    return () => {
      disposed = true;
      io.disconnect();
      cleanupPhysics?.();
    };
  }, [chips]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto mt-9 h-52 max-w-2xl sm:mt-10 sm:h-60",
        physics
          ? "cursor-grab touch-pan-y active:cursor-grabbing"
          : "flex flex-wrap content-end items-end justify-center gap-x-2 gap-y-4"
      )}
    >
      {chips.map((chip, index) => (
        <span
          key={chip}
          ref={(el) => {
            chipRefs.current[index] = el;
          }}
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:px-6 sm:py-3 sm:text-base",
            CHIP_STYLES[index % CHIP_STYLES.length],
            physics &&
              "pointer-events-none absolute left-0 top-0 select-none opacity-0 will-change-transform"
          )}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
