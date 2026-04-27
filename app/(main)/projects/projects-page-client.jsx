"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  CreditCard,
  FolderKanban,
  Library,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";

const emptyHighlights = [
  {
    icon: Activity,
    title: "Client-ready timeline",
    description: "Keep milestones and updates visible in one Activity feed.",
  },
  {
    icon: Library,
    title: "Files & links",
    description: "Share deliverables and references without messy email threads.",
  },
  {
    icon: CreditCard,
    title: "Clear payments",
    description: "Drop in your invoice link so clients always know where to pay.",
  },
];

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

  return (
    <>
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
          )}
        </div>
      </div>
    </>
  );
}
