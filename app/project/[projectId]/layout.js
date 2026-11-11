import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getProjectPortalBundle } from "@/lib/data/project-portal";
import {
  isDemoProjectId,
  getDemoProjectPortalBundle,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";
import { ensureProjectPortalMembership } from "@/lib/actions/project-stakeholders";
import { PresenceHeartbeat } from "@/components/presence-heartbeat";
import { ProjectPortalShell } from "./project-portal-shell";

export default async function ProjectLayout({ children, params }) {
  const { projectId } = await params;

  if (isDemoProjectId(projectId)) {
    const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
    // Demo is public — guests get a fixed freelancer persona; signed-in users stay personalized.
    const freelancer = await resolveDemoFreelancerFromSupabase(supabase, user);
    const demoBundle = getDemoProjectPortalBundle(freelancer);
    return (
      <>
        <ProjectPortalShell bundle={demoBundle}>{children}</ProjectPortalShell>
        <Toaster />
      </>
    );
  }

  // Promote pending invite / primary invite_email into project_members when eligible.
  // Runs alongside the bundle: projects RLS already admits invitees (invite_email / pending
  // invite), so the bundle does not depend on the membership row existing yet.
  const [, bundle] = await Promise.all([
    ensureProjectPortalMembership(projectId),
    getProjectPortalBundle(projectId),
  ]);

  if (!bundle) {
    const user = await getCurrentUser();
    redirect(user ? "/projects" : "/");
  }

  return (
    <>
      <ProjectPortalShell bundle={bundle}>{children}</ProjectPortalShell>
      <PresenceHeartbeat />
      <Toaster />
    </>
  );
}
