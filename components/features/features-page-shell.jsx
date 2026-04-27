"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureRequestsList } from "@/components/features/feature-requests-list";
import { FeatureRoadmap } from "@/components/features/feature-roadmap";
import { AddFeatureForm } from "@/components/features/add-feature-form";
import { voteFeatureRequest } from "@/lib/actions/feature-requests";
import { toast } from "sonner";
import { AlertCircle, Columns3, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function FeatureLabHero({ requests, myVoteIds }) {
  const stats = useMemo(() => {
    const open = requests.filter((r) => r.statusDb !== "done").length;
    const shipped = requests.filter((r) => r.statusDb === "done").length;
    const votesCast = myVoteIds.length;
    return { total: requests.length, open, shipped, votesCast };
  }, [requests, myVoteIds]);

  const items = [
    { label: "Ideas", value: stats.total, hint: "all time" },
    { label: "In flight", value: stats.open, hint: "open + triage" },
    { label: "Shipped", value: stats.shipped, hint: "done" },
    { label: "Your votes", value: stats.votesCast, hint: "upvotes" },
  ];

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-orange-200/40 bg-gradient-to-br from-orange-50/90 via-background to-violet-50/50 p-6 shadow-sm dark:border-orange-900/30 dark:from-orange-950/25 dark:via-background dark:to-violet-950/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-background/80 px-3 py-1 text-xs font-medium text-orange-800 shadow-sm backdrop-blur dark:border-orange-800/50 dark:text-orange-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Product lab
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Help shape what we build next
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            Drop a quick idea, vote on what matters to your workflow, and follow along on the
            roadmap. We read every submission.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4 lg:max-w-lg lg:shrink-0">
          {items.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-center shadow-sm backdrop-blur-sm dark:bg-background/50"
            >
              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {s.value}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="text-[10px] text-muted-foreground/80">{s.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesPageTabs({ requests, myVoteIds, onSubmitted }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("open");
  const [activeTab, setActiveTab] = useState("requests");
  const [isPending, startTransition] = useTransition();
  const [votingId, setVotingId] = useState(null);

  const handleVote = (id) => {
    setVotingId(id);
    startTransition(async () => {
      try {
        const res = await voteFeatureRequest(id);
        if (!res.ok) {
          if (res.error === "already_voted") {
            toast.error("Already voted", {
              description: "You have already upvoted this feature.",
            });
          } else if (res.error === "forbidden" || res.error === "not_signed_in") {
            toast.error("Could not record vote", {
              description: "Sign in as a freelancer to vote.",
            });
          } else {
            toast.error("Could not record vote", { description: res.error });
          }
          return;
        }
        toast.success("Upvoted", { description: "Thanks — your vote helps us prioritize." });
        router.refresh();
      } finally {
        setVotingId(null);
      }
    });
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="my-auto mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/features">Features</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Feature lab</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <FeatureLabHero requests={requests} myVoteIds={myVoteIds} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-auto gap-1 rounded-xl bg-muted/60 p-1.5">
                <TabsTrigger
                  value="requests"
                  className={cn(
                    "gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <ListChecks className="h-4 w-4 opacity-70" aria-hidden />
                  Ideas & votes
                </TabsTrigger>
                <TabsTrigger
                  value="roadmap"
                  className={cn(
                    "gap-2 rounded-lg px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  )}
                >
                  <Columns3 className="h-4 w-4 opacity-70" aria-hidden />
                  Roadmap
                </TabsTrigger>
              </TabsList>

              {activeTab === "requests" && (
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                  <TabsList className="h-auto gap-0.5 rounded-lg bg-muted/40 p-1">
                    <TabsTrigger value="open" className="rounded-md px-4 text-sm">
                      Open
                    </TabsTrigger>
                    <TabsTrigger value="done" className="rounded-md px-4 text-sm">
                      Shipped
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <TabsContent value="requests" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(300px,420px)_1fr]">
                <div className="lg:sticky lg:top-24">
                  <AddFeatureForm onSubmitted={onSubmitted} />
                </div>
                <div className="min-w-0">
                  <FeatureRequestsList
                    requests={requests}
                    myVoteIds={myVoteIds}
                    filter={statusFilter}
                    onVote={handleVote}
                    voteBusyId={isPending ? votingId : null}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0 focus-visible:outline-none">
              <FeatureRoadmap
                requests={requests}
                myVoteIds={myVoteIds}
                onVote={handleVote}
                voteBusyId={isPending ? votingId : null}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export function FeaturesPageShell({ ok, error, requests, myVoteIds }) {
  const router = useRouter();

  if (!ok && error === "forbidden") {
    return (
      <>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="my-auto mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Feature lab</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Freelancer workspace</AlertTitle>
            <AlertDescription>
              Suggesting and voting is available to freelancer accounts. Client portal accounts use
              a different experience.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!ok) {
    return (
      <>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="my-auto mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Feature lab</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error || "Unable to load feature requests."}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <FeaturesPageTabs
      requests={requests}
      myVoteIds={myVoteIds}
      onSubmitted={() => router.refresh()}
    />
  );
}
