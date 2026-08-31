import Link from "next/link";
import { Check } from "lucide-react";
import { WHATS_NEW_GROUPS } from "@/lib/marketing/whats-new";
import { appPath } from "@/lib/site-urls";
import { Button } from "@/components/ui/button";

function DateDivider({ date, label }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1 bg-zinc-200" aria-hidden />
      <time
        dateTime={date}
        className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400"
      >
        {label}
      </time>
      <div className="h-px flex-1 bg-zinc-200" aria-hidden />
    </div>
  );
}

function UpdateCard({ item }) {
  return (
    <article className="rounded-2xl bg-zinc-50 px-6 py-7 sm:px-8 sm:py-8">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.category.className}`}
      >
        <span aria-hidden>{item.category.emoji}</span>
        {item.category.label}
      </div>
      <h2 className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-[-0.03em] text-zinc-900 sm:text-[1.75rem]">
        {item.title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-zinc-600">{item.description}</p>
      <ul className="mt-6 space-y-3">
        {item.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-zinc-600">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function WhatsNewPage() {
  return (
    <div className="min-h-svh bg-white text-zinc-900">
      <header className="border-b border-zinc-100 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-6 w-auto opacity-90"
              draggable={false}
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-zinc-500">
            <Link href="/pricing" className="transition hover:text-orange-600">
              Pricing
            </Link>
            <Link href={appPath("/")} className="transition hover:text-orange-600">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          What&apos;s new
        </p>
        <h1 className="mt-4 text-balance text-center text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-zinc-900 sm:text-5xl">
          Making client projects{" "}
          <span className="font-serif font-normal italic">clearer</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-zinc-500 sm:text-lg">
          New features and improvements to your client workspace — what changed, why it
          matters, and how it helps you deliver with less back-and-forth.
        </p>

        <div className="mt-14 space-y-10 sm:mt-16">
          {WHATS_NEW_GROUPS.map((group) => (
            <section key={group.date} aria-labelledby={`whats-new-${group.date}`}>
              <DateDivider date={group.date} label={group.dateLabel} />
              <h2 id={`whats-new-${group.date}`} className="sr-only">
                Updates from {group.dateLabel}
              </h2>
              <div className="mt-6 space-y-5">
                {group.items.map((item) => (
                  <UpdateCard key={item.title} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-10 text-center sm:mt-20 sm:px-10 sm:py-12">
          <h2 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-3xl">
            Try the client workspace{" "}
            <span className="font-serif font-normal italic">freelancers use</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base">
            One branded link for files, feedback, and approvals — set up in minutes.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 rounded-full bg-orange-500 px-6 text-white hover:bg-orange-600"
            >
              <Link href={appPath("/?intent=signup")}>Get started free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-zinc-200 px-6 text-zinc-700 hover:bg-white"
            >
              <Link href="/#features">See how it works</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-zinc-600">
            ← Back to home
          </Link>
          <p className="text-sm text-zinc-400">© {new Date().getFullYear()} Mably</p>
        </div>
      </footer>
    </div>
  );
}
