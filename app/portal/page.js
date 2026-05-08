import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import {
  listAccessibleClientPortals,
  getCurrentPortalViewer,
} from "@/lib/data/client-portals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";

export const metadata = {
  title: "Your portals",
  description: "Pick a project portal to enter",
};

export const dynamic = "force-dynamic";

function firstName(name) {
  const s = (name || "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0];
}

export default async function PortalChooserPage() {
  const [portals, viewer] = await Promise.all([
    listAccessibleClientPortals(),
    getCurrentPortalViewer(),
  ]);

  if (portals.length === 1) {
    redirect(`/project/${portals[0].id}/dashboard`);
  }

  const greetingName = firstName(viewer?.name);
  const initial = (viewer?.name || viewer?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <img
        src="/images/Login-background.webp"
        alt=""
        className="absolute inset-x-0 top-0 z-1 h-100 w-full rounded-xl object-cover"
        draggable={false}
      />
      <div className="absolute inset-x-0 top-0 h-100 bg-gradient-to-b from-background/0 via-background/20 to-background" />

      <header className="relative z-10 px-6 sm:px-10 lg:px-16 pt-8 pb-6 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <img
            src="/images/Logo-SVG.svg"
            alt="Mably"
            className="h-7 w-auto"
            draggable={false}
          />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" className="gap-2">
              <LogOut className="size-4" aria-hidden />
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100svh-104px)] items-center px-6 pb-32 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-10 max-w-2xl text-center [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Your portals
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {greetingName}.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {portals.length > 0
                ? "Pick a project to open its portal."
                : "You don't have any project portals yet."}
            </p>
          </div>

          {portals.length === 0 ? (
            <div className="[animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <EmptyState />
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portals.map((p, idx) => (
                <div
                  key={p.id}
                  className="[animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${150 + idx * 80}ms` }}
                >
                  <PortalCard portal={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {(viewer?.name || viewer?.email) ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-6 [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-border bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Avatar className="size-7">
              <AvatarImage src={viewer?.avatar || undefined} alt={viewer?.name || ""} />
              <AvatarFallback className="text-[11px]">{initial}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-xs font-medium text-foreground">
                {viewer?.name || "Signed in"}
              </div>
              {viewer?.email ? (
                <div className="text-[11px] text-muted-foreground">{viewer.email}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PortalCard({ portal }) {
  const dotClass =
    portal.statusTone === "active"
      ? "bg-emerald-500"
      : portal.statusTone === "completed"
        ? "bg-sky-500"
        : "bg-zinc-400";

  return (
    <Link
      href={`/project/${portal.id}/dashboard`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex items-center justify-between">
        <Avatar className="size-12 rounded-xl">
          <AvatarImage src={portal.logo} alt="" className="object-cover" />
          <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
            {(portal.name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />
          {portal.status}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {portal.name}
        </h3>
        <div className="flex items-center gap-2">
          <Avatar className="size-5">
            <AvatarImage
              src={portal.freelancerAvatar || undefined}
              alt={portal.freelancerName}
            />
            <AvatarFallback className="text-[10px]">
              {(portal.freelancerName || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            with {portal.freelancerName}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        <span>Open portal</span>
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        No portals yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        If your freelancer just invited you, please open the link they sent in
        the invitation email. New portals will show up here automatically.
      </p>
    </div>
  );
}
