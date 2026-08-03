"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || "";
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

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

function initPostHogOnce() {
  if (!posthogKey || typeof window === "undefined") return false;
  if (posthog.__loaded) return true;

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: "2025-05-24",
      // Only create person profiles when we call identify (signed-in users).
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      capture_exceptions: false,
      on_request_error: () => {
        /* ad blockers / privacy extensions often block us.i.posthog.com */
      },
    });
    return true;
  } catch {
    return false;
  }
}

export function PostHogProvider({ children }) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    initPostHogOnce();
  }, []);

  if (!posthogKey) {
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
