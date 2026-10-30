import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Content-area placeholder for route `loading.js` files (header bar + card grid). */
export function AppPageSkeleton({ className }) {
  return (
    <div className={cn("flex flex-1 flex-col", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="sticky top-0 z-10 border-b bg-background/95">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-40" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-4 rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full-screen placeholder (sidebar + content) for entering the freelancer app or a project portal. */
export function SidebarShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
      <AppPageSkeleton />
    </div>
  );
}
