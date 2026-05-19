"use client";

import { useEffect, useState } from "react";
import { FounderWelcomeDialog } from "@/components/founder-welcome-dialog";
import { consumeFounderWelcomePending } from "@/lib/founder/founder-welcome";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProjectCard } from "@/components/project-card";

import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";

function ProjectsEmptyState() {
  return (
    <div className="flex w-full min-h-[min(36rem,calc(100vh-11rem))] flex-col items-center justify-center py-4 sm:py-8">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/15 bg-card/80 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06] backdrop-blur-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_-20%,var(--color-primary),transparent_55%)] opacity-[0.14]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-primary/5 blur-2xl"
        />
        <div className="relative px-6 pb-10 pt-12 text-center sm:px-10 sm:pb-12 sm:pt-14">
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            You&apos;re set up — add a project
          </div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Your workspace is ready for its first project
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Spin up a guided setup in a few minutes: brief, pricing, branding, and a
            polished portal your clients will actually enjoy using.
          </p>
          <Button asChild size="lg" className="mt-8 gap-2 rounded-xl px-7 font-semibold shadow-sm">
            <Link href="/projects/new">
              <Plus className="h-5 w-5 stroke-2" />
              Create your first project
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectsPageClient({ initialProjects }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [founderWelcomeOpen, setFounderWelcomeOpen] = useState(false);

  useEffect(() => {
    if (consumeFounderWelcomePending()) {
      setFounderWelcomeOpen(true);
    }
  }, []);

  return (
    <>
      <FounderWelcomeDialog
        open={founderWelcomeOpen}
        onOpenChange={setFounderWelcomeOpen}
      />

      <DeleteProjectDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        project={deleteTarget}
      />
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 my-auto mr-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>All Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <Button asChild className="flex items-center gap-1 font-semibold rounded-lg">
            <Link href="/projects/new">
              <Plus className="h-5 w-5 stroke-2" />
              <span className="hidden sm:inline">Create new project</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {initialProjects.length === 0 ? (
            <ProjectsEmptyState />
          ) : (
            <>
              {initialProjects.length === 1 && initialProjects[0]?.isDemo ? (
                <div className="relative mb-6 overflow-hidden rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-background to-violet-50/40 px-4 py-3 dark:border-orange-900/30 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-300/20 blur-2xl dark:bg-orange-500/10"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-violet-300/15 blur-2xl dark:bg-violet-500/10"
                  />
                  <div className="relative flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                    <div className="text-sm leading-relaxed text-foreground/80 font-medium">
                      <span className="font-medium text-foreground">Welcome to Mably.</span>{" "}
                      Open the demo project below to see what a fully-loaded client portal feels like.
                      <Link
                        href="/projects/new"
                        className="ml-1 font-semibold text-orange-600 underline-offset-4 transition-colors hover:text-orange-700 hover:underline dark:text-orange-300 dark:hover:text-orange-200"
                      >
                        Create your first real project
                      </Link>{" "}
                      anytime.
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {initialProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onRequestDelete={(p) =>
                      setDeleteTarget({ id: p.id, name: p.name ?? "" })
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
