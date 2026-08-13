"use client";

import { FileCheck, Link2, MessageSquare, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared "How it works" section — landing-style step cards with live UI
 * element previews instead of images. Pass `intro` / `steps` copy overrides
 * per page for SEO; the visuals stay consistent.
 */

const DEFAULT_STEPS = [
  {
    step: "1",
    title: "Create a project.",
    copy: "Add your branding and welcome message — a client-ready workspace in minutes.",
    icon: Palette,
    iconClass: "bg-rose-400",
    preview: "branding",
  },
  {
    step: "2",
    title: "Send one link.",
    copy: "Invite your client — and anyone else who needs access — without a walkthrough or folder scavenger hunt.",
    icon: Link2,
    iconClass: "bg-blue-500",
    preview: "invite",
  },
  {
    step: "3",
    title: "Share, review, approve.",
    copy: "Deliver files, collect feedback, and get sign-off with a clear record of what was approved.",
    icon: FileCheck,
    iconClass: "bg-orange-500",
    preview: "library",
  },
];

/** @param {{ type: string }} props */
function HowItWorksPreview({ type }) {
  if (type === "branding") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-600">
            AC
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-800">Acme Brand Workspace</p>
            <p className="text-[10px] text-zinc-400">Project name</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["#f97316", "#18181b", "#3b82f6"].map((color) => (
            <span
              key={color}
              className="h-6 w-6 rounded-full ring-2 ring-white"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
          Welcome to your project workspace…
        </div>
      </div>
    );
  }

  if (type === "invite") {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          Client invite link
        </p>
        <p className="mt-1 truncate text-xs font-medium text-zinc-700">
          mably.app/project/acme-brand
        </p>
        <div className="mt-3 flex justify-end">
          <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[10px] font-medium text-white">
            Copy link
          </span>
        </div>
      </div>
    );
  }

  if (type === "library") {
    return (
      <div className="space-y-2">
        {[
          { name: "Brand guidelines.pdf", status: "Approved", statusClass: "bg-emerald-100 text-emerald-700" },
          { name: "Homepage mockup.png", status: "Pending", statusClass: "bg-amber-100 text-amber-700" },
        ].map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2"
          >
            <span className="truncate text-xs font-medium text-zinc-700">{file.name}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                file.statusClass
              )}
            >
              {file.status}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-[10px] text-zinc-400">
          <MessageSquare className="h-3.5 w-3.5" />
          3 comments on latest revision
        </div>
      </div>
    );
  }

  return null;
}

/**
 * @param {{
 *   id?: string;
 *   headline?: string;
 *   intro?: string;
 *   steps?: { title?: string; copy?: string }[];
 * }} props
 * `steps` overrides merge onto the three defaults by index (copy only — icons
 * and previews stay consistent across pages).
 */
export function HowItWorksSection({ id = "how", headline = "How it works", intro, steps }) {
  const mergedSteps = DEFAULT_STEPS.map((step, index) => ({
    ...step,
    ...(steps?.[index] ?? {}),
  }));

  return (
    <section id={id} className="scroll-mt-24 px-4 py-16 sm:px-5 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-lg text-center sm:mb-16">
          <h2
            data-split
            className="text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
          >
            {headline}
          </h2>
          {intro ? (
            <p data-reveal className="mt-4 text-base text-zinc-500 sm:text-lg">
              {intro}
            </p>
          ) : null}
        </div>

        <div
          data-reveal-group
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {mergedSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.step}
                data-reveal-item
                className="flex flex-col rounded-[1.75rem] bg-[#f9f8f3] p-6 sm:p-7"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm",
                    step.iconClass
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                  {step.copy}
                </p>
                <div className="mt-6 rounded-2xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
                  <HowItWorksPreview type={step.preview} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
