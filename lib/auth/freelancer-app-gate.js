import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { resolveClientLandingPath } from "@/lib/auth/resolve-client-landing";

/**
 * Access gate for freelancer app routes under `app/(app)/(main)`: signed in, not a client, onboarded.
 * Middleware skips its profile lookup for these paths, so the `(main)` layout must call this.
 *
 * Next renders pages in parallel with their layouts, so a layout redirect does not stop a page's
 * own work — pages that write during render must `await` this before writing.
 *
 * Deduped per request via React `cache` (redirects are cached too).
 */
export const requireFreelancerAppProfile = cache(async () => {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/");
  }
  if (profile.role === "client") {
    redirect(await resolveClientLandingPath(await createClient()));
  }
  if (!profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  return profile;
});
