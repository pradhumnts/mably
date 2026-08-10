"use client";

import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import {
  ensurePostHog,
  isPostHogConfigured,
  posthog,
} from "@/lib/analytics/client";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    try {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += `?${search}`;
      ph.capture("$pageview", { $current_url: url });
    } catch {
      /* analytics must never break the app */
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }) {
  // Init on first client render (not only in useEffect) so child identify /
  // trackEvent calls in the same tick don't silently no-op.
  if (typeof window !== "undefined") {
    ensurePostHog();
  }

  if (!isPostHogConfigured()) {
    return children;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
