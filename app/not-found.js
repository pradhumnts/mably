import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingPath } from "@/lib/site-urls";

const HOME = marketingPath("/");
const SOLUTIONS = [
  { label: "For freelancers", href: marketingPath("/for/freelancers") },
  { label: "For designers", href: marketingPath("/for/designers") },
  { label: "What's new", href: marketingPath("/whats-new") },
];

/**
 * Global 404 — returns a real HTTP 404 (good for SEO) with a calm
 * branded page and a clear path back to the marketing homepage.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#faf9f6] text-zinc-900 antialiased">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.08),_transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <Link href={HOME} className="mb-10">
          <img
            src="/images/Logo-SVG.svg"
            alt="Mably"
            className="h-7 w-auto"
            draggable={false}
          />
        </Link>

        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
          404
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.035em] text-zinc-900 sm:text-5xl">
          This page isn’t here.
        </h1>
        <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-zinc-500 sm:text-lg">
          The link may be old, or the page may have moved. Head home — or jump
          into one of these instead.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            className="group h-12 rounded-full bg-orange-500 px-8 text-base font-semibold text-white shadow-[0_8px_30px_-6px_rgba(249,115,22,0.45)] hover:bg-orange-600"
          >
            <Link href={HOME}>
              Go to homepage
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <nav
          aria-label="Helpful links"
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500"
        >
          {SOLUTIONS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
