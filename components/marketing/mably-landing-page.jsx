"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LayoutDashboard,
  Library,
  MessageSquare,
  CreditCard,
  Sparkles,
  Zap,
} from "lucide-react";

const navLinkClass =
  "text-sm font-medium text-foreground/90 transition hover:text-foreground underline-offset-4 hover:underline";

function ProductMockup() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="mably-animate-float relative">
      <div
        className="pointer-events-none absolute -inset-1 rounded-[1.15rem] bg-gradient-to-tr from-orange-400/25 via-violet-400/15 to-transparent opacity-80 blur-md"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_32px_90px_-20px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.05]">
        <div className="flex h-9 items-center gap-2 border-b border-border/80 bg-muted/40 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          <span className="ml-2 truncate text-[10px] font-medium text-muted-foreground">
            Project · Client portal
          </span>
        </div>
        <div className="flex min-h-[280px] sm:min-h-[320px]">
          <aside className="hidden w-44 shrink-0 border-r border-border/60 bg-muted/25 p-3 sm:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Menu
            </p>
            <ul className="space-y-1 text-xs font-medium text-foreground/80">
              <li className="flex items-center gap-2 rounded-md bg-orange-500/10 px-2 py-1.5 text-orange-700">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5">
                <Library className="h-3.5 w-3.5 text-muted-foreground" />
                Library
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Payments
              </li>
              <li className="flex items-center gap-2 px-2 py-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                Messages
              </li>
            </ul>
          </aside>
          <div className="flex-1 space-y-4 p-4 sm:p-5">
            <div>
              <p className="text-[10px] text-muted-foreground">Home / Dashboard</p>
              <p className="text-lg font-semibold tracking-tight">Dashboard</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[10px] font-medium text-muted-foreground">This week</p>
                <div className="mt-3 flex h-16 items-end justify-between gap-1">
                  {bars.map((h, i) => (
                    <div key={i} className="flex h-full flex-1 items-end justify-center">
                      <div
                        className="mably-bar-rise w-full max-w-[10px] rounded-sm bg-gradient-to-t from-orange-200 to-orange-500"
                        style={{
                          height: `${h}%`,
                          "--mably-bar-delay": `${i * 0.07}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                  <p className="text-[10px] text-muted-foreground">Invoices</p>
                  <p className="text-xl font-bold tabular-nums">$12.4k</p>
                  <p className="text-[10px] font-medium text-emerald-600">+12% vs last month</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                  <p className="text-[10px] text-muted-foreground">Files shared</p>
                  <p className="text-xl font-bold tabular-nums">48</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-3 py-2 text-[10px] text-muted-foreground">
              Latest activity · Invoice sent · Design v3 uploaded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const faqItems = [
  {
    q: "What is Mably?",
    a: "Mably is a client portal for freelancers and small studios. Each project gets a branded space where clients see activity, files, invoices, and messages — without digging through email threads.",
  },
  {
    q: "Do my clients need an account?",
    a: "Clients access the portal with a secure link and sign-in. You control invitations and what they can see per project.",
  },
  {
    q: "Can I use my own branding?",
    a: "Yes. Projects support your logo, brand color, and a welcome message so the experience feels like yours, not a generic tool.",
  },
  {
    q: "Is my data secure?",
    a: "Mably is built on modern infrastructure with authentication and row-level access so clients only see their own projects.",
  },
];

const integrationDots = [
  { label: "Files", className: "bg-sky-500" },
  { label: "Pay", className: "bg-emerald-500" },
  { label: "Chat", className: "bg-violet-500" },
  { label: "Mail", className: "bg-orange-500" },
  { label: "Cal", className: "bg-rose-500" },
];

export function MablyLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.42]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 55% at 50% -15%, rgb(254 215 170), transparent), radial-gradient(ellipse 50% 45% at 100% 5%, rgb(224 231 255), transparent)",
        }}
      />

      {/* Nav — floating glass pill */}
      <header className="sticky top-0 z-50 px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        <div className="mably-fade-up mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/70 px-3 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:h-[3.75rem] sm:gap-6 sm:px-6 md:px-8 dark:border-white/10 dark:bg-background/65">
          <Link href="/landing" className="flex shrink-0 items-center gap-2">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-7 w-auto sm:h-8"
              width={112}
              height={32}
              draggable={false}
            />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#product" className={navLinkClass}>
              Product
            </a>
            <a href="#features" className={navLinkClass}>
              Features
            </a>
            <a href="#pricing" className={navLinkClass}>
              Pricing
            </a>
            <a href="#faq" className={navLinkClass}>
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" asChild className="hidden text-foreground sm:inline-flex">
              <Link href="/">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full px-4 shadow-md sm:px-5">
              <Link href="/">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-6 sm:pb-28 sm:pt-8">
        <div
          className="mably-blob pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-orange-300/40 blur-3xl sm:right-[8%]"
          aria-hidden
        />
        <div
          className="mably-blob-reverse pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl sm:left-[4%]"
          aria-hidden
        />
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/form-background.webp"
            alt=""
            className="h-full w-full object-cover opacity-[0.28]"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/88 to-background" />
        </div>
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
          <div className="space-y-8">
            <div className="mably-fade-up mably-fade-up-delay-1 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/85 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Client experience, without the chaos
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-[-0.04em] text-balance sm:text-5xl sm:tracking-[-0.045em] lg:text-[3.5rem] lg:leading-[1.05]">
                <span className="mably-fade-up mably-fade-up-delay-1 block">
                  One calm portal for
                </span>
                <span className="mably-fade-up mably-fade-up-delay-2 mt-1 block sm:mt-2">
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                    every client project
                  </span>
                  <span className="text-foreground">.</span>
                </span>
              </h1>
              <p className="mably-fade-up mably-fade-up-delay-3 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                Share files, invoices, and updates in a branded workspace your clients actually use
                — so you spend less time chasing status and more time shipping work.
              </p>
            </div>
            <div className="mably-fade-up mably-fade-up-delay-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-orange-500/15" asChild>
                <Link href="/">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-foreground/15 bg-background/85 backdrop-blur transition hover:bg-background"
                asChild
              >
                <a href="#product">See how it works</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card to explore · Built for freelancers & small studios
            </p>
          </div>
          <div className="relative lg:pl-2">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-orange-300/45 via-transparent to-violet-300/35 blur-3xl"
              aria-hidden
            />
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Integrations + logo strip */}
      <section className="border-y border-border/50 bg-muted/15 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Plays nicely with your stack
            </p>
            <div className="mb-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {integrationDots.map(({ label, className }) => (
                <div
                  key={label}
                  className="group flex flex-col items-center gap-2 transition duration-300 hover:-translate-y-1"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[10px] font-bold text-white shadow-lg ring-4 ring-background/80 transition group-hover:scale-105 ${className}`}
                  >
                    {label.slice(0, 2)}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:bg-card/40">
              <div className="mably-shimmer-border pointer-events-none absolute inset-0 rounded-3xl opacity-60" aria-hidden />
              <p className="relative mb-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Built for teams who live in deliverables
              </p>
              <div className="relative flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70 grayscale transition duration-500 hover:opacity-90 hover:grayscale-0">
                {["Studio", "Agency", "Consulting", "Creative", "Dev shop", "Brand"].map((name) => (
                  <span
                    key={name}
                    className="text-sm font-semibold tracking-tight text-foreground/75 transition hover:text-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-28 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-2 text-sm font-semibold text-orange-600">Why Mably</p>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                Everything clients ask for — organised by default
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Activity, library, payments, and chat in one place. Fewer &quot;where is that
                file?&quot; messages, clearer approvals, faster sign-off.
              </p>
            </div>
          </LandingReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: LayoutDashboard,
                title: "Living activity feed",
                desc: "A clear timeline of uploads, comments, invoices, and milestones so nobody is out of the loop.",
              },
              {
                icon: Library,
                title: "Library that scales",
                desc: "Files and links together — with optional approvals when deliverables need a formal OK.",
              },
              {
                icon: CreditCard,
                title: "Payments without confusion",
                desc: "Share invoice links and status in the same portal clients already trust for everything else.",
              },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <LandingReveal key={title} className="h-full" style={{ transitionDelay: `${idx * 60}ms` }}>
                <Card className="h-full border-border/80 shadow-md transition duration-300 hover:-translate-y-1 hover:border-orange-200/50 hover:shadow-xl dark:hover:border-orange-500/25">
                  <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{desc}</CardDescription>
                  </CardHeader>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bento highlight */}
      <section className="border-t border-border/50 bg-muted/10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
              <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-orange-500/15 via-card to-card p-8 shadow-lg lg:row-span-2 lg:flex lg:flex-col lg:justify-end">
                <p className="text-sm font-semibold text-orange-600">Single source of truth</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  One link. One thread. One calm inbox.
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Replace scattered tools with a portal clients recognize — so updates do not get
                  buried in email noise.
                </p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md transition duration-300 hover:shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Approvals
                </p>
                <p className="mt-2 text-lg font-semibold">Sign-off without the ping-pong</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Optional file approvals keep creative reviews structured.
                </p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-md transition duration-300 hover:shadow-lg sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Branding
                </p>
                <p className="mt-2 text-lg font-semibold">Your studio, their experience</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Logo, colour, and welcome copy per project — not a generic SaaS shell.
                </p>
              </div>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Split + image */}
      <section id="product" className="scroll-mt-28 border-t border-border/60 bg-muted/15 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <LandingReveal className="order-2 space-y-6 lg:order-1">
            <p className="text-sm font-semibold text-orange-600">Product</p>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              A portal that feels like your brand — not another tab to forget
            </h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Set welcome copy, colours, and logo once per project. Clients land in a focused
              workspace instead of a cluttered inbox thread from three months ago.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                "Branded sidebar and project identity",
                "Role-aware views for you vs. your client",
                "Real-time-friendly updates where it matters",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="rounded-full border-foreground/20" asChild>
              <Link href="/">Open the app</Link>
            </Button>
          </LandingReveal>
          <LandingReveal className="order-1 lg:order-2">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-[0_28px_80px_-24px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.06] transition duration-500 hover:shadow-[0_36px_90px_-20px_rgba(249,115,22,0.18)]">
              <img
                src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=900&q=80"
                alt="Placeholder: team collaboration"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
              <p className="absolute bottom-4 left-4 right-4 text-xs text-muted-foreground">
                Placeholder image — swap for product photography or a real portal screenshot.
              </p>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Stats — dark band */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <div className="grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-8 py-12 text-white shadow-[0_32px_80px_-28px_rgba(0,0,0,0.45)] sm:grid-cols-3 sm:gap-6 sm:px-10 sm:py-14">
              {[
                { k: "Less chasing", v: "One link", d: "Clients know where to go." },
                { k: "Clearer scope", v: "One thread", d: "Per file, per invoice, per message." },
                { k: "Faster sign-off", v: "One flow", d: "Approvals when you need them." },
              ].map((s) => (
                <div
                  key={s.k}
                  className="text-center transition duration-300 hover:translate-y-[-2px] sm:text-left"
                >
                  <p className="text-3xl font-bold tracking-tight text-orange-400 sm:text-4xl">{s.v}</p>
                  <p className="mt-2 font-semibold text-white/95">{s.k}</p>
                  <p className="mt-1 text-sm text-white/60">{s.d}</p>
                </div>
              ))}
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/60 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              What teams want from a client portal
            </h2>
          </LandingReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "We stopped resending the same Drive links. Clients comment on the actual file — it’s obvious what changed.",
                who: "Placeholder quote",
                role: "Creative lead",
              },
              {
                quote:
                  "Invoices live next to deliverables. Fewer “did you get paid?” texts at the end of the month.",
                who: "Placeholder quote",
                role: "Independent consultant",
              },
              {
                quote:
                  "The activity feed is our single source of truth for “what happened this week” on each account.",
                who: "Placeholder quote",
                role: "Studio owner",
              },
            ].map((t, i) => (
              <LandingReveal key={i} style={{ transitionDelay: `${i * 80}ms` }}>
                <Card className="h-full border-border/80 bg-card shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-500 shadow-inner" />
                      <div>
                        <p className="text-sm font-semibold">{t.who}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-sm font-semibold text-orange-600">Pricing</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple plans when you’re ready
              </h2>
              <p className="mt-2 text-muted-foreground">
                Placeholder tiers — align with your real billing before launch.
              </p>
            </div>
          </LandingReveal>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {[
              {
                name: "Starter",
                price: "$0",
                blurb: "Try the workflow",
                highlight: false,
                feats: ["1 active project", "Client portal", "Library & activity"],
              },
              {
                name: "Pro",
                price: "$29",
                blurb: "per month",
                highlight: true,
                feats: ["Unlimited projects", "Branding per project", "Email notifications"],
              },
              {
                name: "Studio",
                price: "Let’s talk",
                blurb: "teams & white-label",
                highlight: false,
                feats: ["Volume & onboarding", "Priority support", "Custom terms"],
              },
            ].map((plan, i) => (
              <LandingReveal key={plan.name} style={{ transitionDelay: `${i * 70}ms` }}>
                <Card
                  className={`relative flex h-full flex-col overflow-hidden border-2 shadow-lg transition duration-300 hover:-translate-y-1 ${
                    plan.highlight
                      ? "border-orange-500/70 bg-gradient-to-b from-orange-50/80 via-card to-card shadow-orange-500/10 lg:scale-[1.02] dark:from-orange-950/30 dark:via-card dark:to-card"
                      : "border-border/80 hover:border-border"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-md">
                      Popular
                    </span>
                  ) : null}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.blurb}</CardDescription>
                    <p className="pt-2 text-3xl font-bold tracking-tight">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <ul className="space-y-2 text-sm">
                      {plan.feats.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0 text-orange-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.highlight ? (
                      <Button className="mt-auto w-full rounded-full shadow-md" asChild>
                        <Link href="/">Get started</Link>
                      </Button>
                    ) : plan.name === "Studio" ? (
                      <Button className="mt-auto w-full rounded-full" variant="outline" asChild>
                        <a href="mailto:hello@mably.io" className="text-foreground">
                          Contact sales
                        </a>
                      </Button>
                    ) : (
                      <Button className="mt-auto w-full rounded-full" variant="outline" asChild>
                        <Link href="/">Get started</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 border-t border-border/60 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <LandingReveal>
            <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">Questions</h2>
            <div className="divide-y divide-border rounded-2xl border border-border/80 bg-card shadow-md">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group px-5 py-4 transition-colors open:bg-muted/20 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-foreground">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/form-background.webp"
            alt=""
            className="h-full w-full object-cover opacity-30"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-orange-50/50 to-violet-100/40 dark:from-background/95 dark:via-orange-950/20 dark:to-violet-950/20" />
          <div className="mably-blob pointer-events-none absolute right-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-300/30 blur-3xl" aria-hidden />
        </div>
        <LandingReveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            Ready when you are
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Give your next client a portal they’ll actually use
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign in to set up a project, invite your client, and ship a calmer collaboration
            experience.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full px-10 shadow-lg shadow-orange-500/15" asChild>
              <Link href="/">Sign in to Mably</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-foreground/20 bg-background/90 backdrop-blur"
              asChild
            >
              <a href="mailto:hello@mably.io" className="text-foreground">
                Talk to us
              </a>
            </Button>
          </div>
        </LandingReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-muted/30 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-7 w-auto opacity-90"
              width={100}
              height={28}
              draggable={false}
            />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Client portals for freelancers who care about craft and clarity.
            </p>
          </div>
          <div className="flex flex-wrap gap-10 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Product</p>
              <a href="#features" className={navLinkClass}>
                Features
              </a>
              <a href="#pricing" className={`${navLinkClass} block`}>
                Pricing
              </a>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Legal</p>
              <Link href="/terms" className={`${navLinkClass} block`}>
                Terms
              </Link>
              <Link href="/privacy" className={`${navLinkClass} block`}>
                Privacy
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Account</p>
              <Link href="/" className={`${navLinkClass} block`}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-border/60 px-4 pt-8 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Mably. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
